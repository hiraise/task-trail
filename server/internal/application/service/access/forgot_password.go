package access

import (
	"context"

	"task-trail/internal/application/letter"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// ForgotPasswordService шлёт письмо со ссылкой сброса пароля сразу в запросе: не ушло —
// ошибка в ответе, а не только в логе (ADR-0017). Без почты ссылку выдаёт администратор.
type ForgotPasswordService struct {
	userRepository     repository.UserRepository
	settingsRepository repository.SettingsRepository
	links              *resetLinkIssuer
	mailer             service.Mailer
}

func (s *ForgotPasswordService) Execute(ctx context.Context, email string) error {
	mail, err := s.settingsRepository.GetMail(ctx)
	if err != nil {
		return err
	}
	if mail == nil {
		return domain.ErrMailDisabled("reason", "password reset requested")
	}
	user, err := s.userRepository.GetByEmail(ctx, entity.NewEmail(email))
	if isEntityNotFound(err) {
		// Ответ тот же, что и после письма: по нему не узнать, есть ли такая почта
		return nil
	}
	if err != nil {
		return err
	}
	link, reset, err := s.links.issue(ctx, user.ID)
	if err != nil {
		return err
	}
	return s.mailer.Send(ctx, mail, letter.PasswordReset(user.Email, link.URL, reset.Lifetime()))
}
