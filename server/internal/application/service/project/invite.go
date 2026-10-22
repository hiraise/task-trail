package project

import (
	"context"
	"errors"
	"sync"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/letter"
	"task-trail/internal/application/link"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// Письма приглашений уходят в запросе (ADR-0017), параллельно. Контракт обещает ответ
// не дольше 15 секунд при тайм-ауте веба 20 (addProjectMembers).
const (
	// letterTimeout — сколько ждать отправки одного письма.
	letterTimeout = 10 * time.Second
	// lettersTimeout — сколько ждать всех писем: что не ушло к этому сроку, считается не ушедшим.
	lettersTimeout = 12 * time.Second
	// lettersParallel — сколько писем отправлять одновременно: больше соединений SMTP-сервер
	// может не принять.
	lettersParallel = 10
)

// inviter зовёт почты в проект (ADR-0016): почта с аккаунтом сразу становится участником,
// без аккаунта — получает приглашение.
type inviter struct {
	clock       service.Clock
	users       repository.UserRepository
	members     repository.ProjectMemberRepository
	invitations repository.InvitationRepository
	factory     *factory.InvitationFactory
	settings    repository.SettingsRepository
	mailer      service.Mailer
}

// invitationEnv — настройки, с которыми зовут: почта (nil — выключена) и адрес сервиса.
type invitationEnv struct {
	mail       *entity.MailSettings
	serviceURL string
}

// invitation — результат по одной почте и письмо, которое осталось отправить.
type invitation struct {
	result dto.InvitationResult
	letter *service.Letter
	// required — письмо со ссылкой приглашения: не ушло — результат mail_failed. Извещение
	// тому, кого добавили сразу, необязательно: не ушло — человек всё равно участник.
	required bool
}

// env читает настройки до транзакции: письма уходят после неё.
func (i *inviter) env(ctx context.Context) (invitationEnv, error) {
	mail, err := i.settings.GetMail(ctx)
	if err != nil {
		return invitationEnv{}, err
	}
	serviceURL, err := i.settings.GetServiceURL(ctx)
	if err != nil {
		return invitationEnv{}, err
	}
	if serviceURL == "" {
		// Адрес задаётся вместе с первым аккаунтом, а без аккаунтов звать некому
		return invitationEnv{}, errors.New("адрес сервиса не задан")
	}
	return invitationEnv{mail: mail, serviceURL: serviceURL}, nil
}

// invite зовёт почты в project от имени by — в транзакции, под блокировкой проекта.
// Результат — по каждой почте в порядке запроса; повтор почты получает тот же результат.
func (i *inviter) invite(ctx context.Context, env invitationEnv, project *entity.Project, by *entity.UserAccount, emails []string) ([]*invitation, error) {
	now := i.clock.Now()
	seen := make(map[entity.Email]*invitation, len(emails))
	out := make([]*invitation, 0, len(emails))
	for _, raw := range emails {
		email := entity.NewEmail(raw)
		if inv, ok := seen[email]; ok {
			out = append(out, inv)
			continue
		}
		inv, err := i.inviteOne(ctx, env, project, by, email, now)
		if err != nil {
			return nil, err
		}
		seen[email] = inv
		out = append(out, inv)
	}
	return out, nil
}

func (i *inviter) inviteOne(ctx context.Context, env invitationEnv, project *entity.Project, by *entity.UserAccount, email entity.Email, now time.Time) (*invitation, error) {
	inviterName := entity.DisplayName(by.Username, by.Email)
	user, err := i.users.GetByEmail(ctx, email)
	switch {
	case err == nil:
		return i.add(ctx, env, project, inviterName, user, now)
	case !domain.HasCode(err, domain.EntityNotFound):
		return nil, err
	}
	token, record := i.factory.New(project.ID, email, by.ID)
	if err := i.invitations.Create(ctx, record); err != nil {
		return nil, err
	}
	url := link.Invitation(env.serviceURL, token)
	inv := &invitation{result: dto.InvitationResult{Email: email, Outcome: dto.InvitationInvited}}
	if env.mail == nil {
		// Без почты ссылку передаёт сам пригласивший (ADR-0017)
		inv.result.InviteURL = &url
		return inv, nil
	}
	l := letter.Invitation(email, inviterName, project.Name, url, record.Lifetime())
	inv.letter, inv.required = &l, true
	return inv, nil
}

// add делает человека с аккаунтом участником и готовит извещение, если почта включена.
func (i *inviter) add(ctx context.Context, env invitationEnv, project *entity.Project, inviterName string, user *entity.UserAccount, now time.Time) (*invitation, error) {
	inv := &invitation{result: dto.InvitationResult{Email: user.Email}}
	_, err := i.members.Get(ctx, project.ID, user.ID)
	switch {
	case err == nil:
		inv.result.Outcome = dto.InvitationAlreadyMember
		return inv, nil
	case !domain.HasCode(err, domain.EntityNotFound):
		return nil, err
	}
	if err := i.members.Add(ctx, entity.NewMember(project.ID, user.ID, now)); err != nil {
		return nil, err
	}
	inv.result.Outcome = dto.InvitationAdded
	if env.mail != nil {
		l := letter.AddedToProject(user.Email, inviterName, project.Name, link.Project(env.serviceURL, project.ID))
		inv.letter = &l
	}
	return inv, nil
}

// send отправляет письма после транзакции: приглашение уже записано, и если письмо со ссылкой
// не ушло, результат — mail_failed, а повторное приглашение отправит новое (ADR-0017).
func (i *inviter) send(ctx context.Context, env invitationEnv, invitations []*invitation) {
	ctx, cancel := context.WithTimeout(ctx, lettersTimeout)
	defer cancel()
	slots := make(chan struct{}, lettersParallel)
	var wg sync.WaitGroup
	sent := make(map[*invitation]bool, len(invitations))
	for _, inv := range invitations {
		if inv.letter == nil || sent[inv] {
			continue
		}
		sent[inv] = true
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := i.sendOne(ctx, env.mail, *inv.letter, slots); err != nil && inv.required {
				inv.result.Outcome = dto.InvitationMailFailed
			}
		}()
	}
	wg.Wait()
}

func (i *inviter) sendOne(ctx context.Context, mail *entity.MailSettings, l service.Letter, slots chan struct{}) error {
	select {
	case slots <- struct{}{}:
		defer func() { <-slots }()
	case <-ctx.Done():
		return ctx.Err()
	}
	ctx, cancel := context.WithTimeout(ctx, letterTimeout)
	defer cancel()
	return i.mailer.Send(ctx, mail, l)
}

func results(invitations []*invitation) []dto.InvitationResult {
	out := make([]dto.InvitationResult, len(invitations))
	for n, inv := range invitations {
		out[n] = inv.result
	}
	return out
}
