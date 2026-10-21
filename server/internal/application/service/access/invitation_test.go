package access_test

import (
	"context"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"

	"go.uber.org/mock/gomock"
)

const (
	inviteToken = "INVITETOKEN"
	projectID   = entity.ProjectID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
	inviterID   = entity.UserID("9d8c7b6a-5e4f-4d3c-8b2a-1f0e9d8c7b6a")
)

func invitation(project entity.ProjectID, expiredAt time.Time) *entity.Invitation {
	return &entity.Invitation{
		ID:        "inv-" + entity.InvitationID(project),
		ProjectID: project,
		Email:     email,
		InvitedBy: inviterID,
		TokenHash: entity.HashLinkToken(inviteToken),
		ExpiredAt: expiredAt,
		CreatedAt: expiredAt.Add(-7 * 24 * time.Hour),
	}
}

func details(expiredAt time.Time, inviterName *string) *repository.InvitationDetails {
	return &repository.InvitationDetails{
		Invitation:      invitation(projectID, expiredAt),
		ProjectName:     "Дизайн-система",
		InviterUsername: inviterName,
		InviterEmail:    "owner@example.com",
	}
}

func (d *deps) expectNoAccount() {
	d.users.EXPECT().GetByEmail(gomock.Any(), email).Return(nil, domain.ErrEntityNotFound(0, nil))
}

func TestInvitationLookup(t *testing.T) {
	name := "Анна"
	for inviter, want := range map[*string]string{&name: "Анна", nil: "owner@example.com"} {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), entity.HashLinkToken(inviteToken)).Return(details(now.Add(time.Hour), inviter), nil)
		d.expectNoAccount()
		info, err := module.InvitationLookup.Execute(context.Background(), inviteToken)
		if err != nil {
			t.Fatal(err)
		}
		if info != (dto.InvitationInfo{Email: email, ProjectName: "Дизайн-система", InvitedBy: want}) {
			t.Errorf("приглашение: %+v", info)
		}
	}
}

func TestInvitationLookupRejected(t *testing.T) {
	t.Run("нет приглашения", func(t *testing.T) {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
		_, err := module.InvitationLookup.Execute(context.Background(), inviteToken)
		requireCode(t, err, domain.LinkInvalid)
	})
	t.Run("истекло", func(t *testing.T) {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), gomock.Any()).Return(details(now, nil), nil)
		d.expectNoAccount()
		_, err := module.InvitationLookup.Execute(context.Background(), inviteToken)
		requireCode(t, err, domain.LinkInvalid)
	})
	// Аккаунт уже есть — ссылка ведёт на вход, даже истёкшая
	t.Run("принято", func(t *testing.T) {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), gomock.Any()).Return(details(now.Add(-time.Hour), nil), nil)
		d.users.EXPECT().GetByEmail(gomock.Any(), email).Return(user(), nil)
		_, err := module.InvitationLookup.Execute(context.Background(), inviteToken)
		requireCode(t, err, domain.InvitationAccepted)
	})
}

var acceptData = dto.AcceptInvitation{Token: inviteToken, Username: "Иван", Password: "password"}

// Аккаунт создаётся подтверждённым и не администратором; действующие приглашения почты
// становятся участием с ролью «участник», истёкшие — нет; сессия открывается сразу.
func TestAcceptInvitation(t *testing.T) {
	module, d := newModule(t)
	d.invitations.EXPECT().GetByTokenHash(outsideTx, entity.HashLinkToken(inviteToken)).Return(details(now.Add(time.Hour), nil), nil)
	d.users.EXPECT().GetByEmail(outsideTx, email).Return(nil, domain.ErrEntityNotFound(0, nil))
	d.passwords.EXPECT().HashPassword("password").Return(passwordHash, nil)
	d.expectTx()
	var created *entity.UserAccount
	d.users.EXPECT().Create(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
		created = u
		return nil
	})
	other := entity.ProjectID("0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d")
	d.invitations.EXPECT().ListByEmail(inTx, email).Return([]*entity.Invitation{
		invitation(projectID, now.Add(time.Hour)),
		invitation("expired", now),
		invitation(other, now.Add(time.Minute)),
	}, nil)
	var added []entity.ProjectID
	d.members.EXPECT().Add(inTx, gomock.Any()).Times(2).DoAndReturn(func(_ context.Context, m *entity.ProjectMember) error {
		if m.UserID != created.ID || m.Role != entity.RoleMember || !m.CreatedAt.Equal(now) {
			t.Errorf("участие: %+v", m)
		}
		added = append(added, m.ProjectID)
		return nil
	})
	d.tokens.EXPECT().Create(inTx, gomock.Any()).Return(nil)
	d.jwt.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(issued("access"), issued("refresh"), nil)

	session, err := module.AcceptInvitation.Execute(context.Background(), acceptData)
	if err != nil {
		t.Fatal(err)
	}
	if created.Email != email || created.PasswordHash != passwordHash || *created.Username != "Иван" ||
		created.IsAdmin || created.VerifiedAt == nil {
		t.Fatalf("аккаунт: %+v", created)
	}
	if session.User != created || session.UserID != created.ID {
		t.Fatalf("сессия: %+v", session)
	}
	if len(added) != 2 || added[0] != projectID || added[1] != other {
		t.Fatalf("участие в проектах %v", added)
	}
}

func TestAcceptInvitationRejected(t *testing.T) {
	// Неверная ссылка отсекается до bcrypt: HashPassword не вызывается
	t.Run("нет приглашения", func(t *testing.T) {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
		_, err := module.AcceptInvitation.Execute(context.Background(), acceptData)
		requireCode(t, err, domain.LinkInvalid)
	})
	// Другую ссылку той же почты приняли параллельно — почта уже занята
	t.Run("параллельное принятие", func(t *testing.T) {
		module, d := newModule(t)
		d.invitations.EXPECT().GetByTokenHash(gomock.Any(), gomock.Any()).Return(details(now.Add(time.Hour), nil), nil)
		d.expectNoAccount()
		d.passwords.EXPECT().HashPassword("password").Return(passwordHash, nil)
		d.expectTx()
		d.users.EXPECT().Create(inTx, gomock.Any()).Return(domain.ErrEntityAlreadyExists(0, nil))
		_, err := module.AcceptInvitation.Execute(context.Background(), acceptData)
		requireCode(t, err, domain.InvitationAccepted)
	})
}

func TestAdminCheck(t *testing.T) {
	admin := user()
	admin.IsAdmin = true
	cases := []struct {
		name    string
		user    *entity.UserAccount
		repoErr error
		want    domain.ErrorCode
	}{
		{"администратор", admin, nil, ""},
		{"не администратор", user(), nil, domain.Forbidden},
		// Пользователя удалили, а access-токен ещё жив — 401, а не 403
		{"нет пользователя", nil, domain.ErrEntityNotFound(0, nil), domain.AccessTokenWrong},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			module, d := newModule(t)
			d.users.EXPECT().GetByID(gomock.Any(), userID).Return(c.user, c.repoErr)
			err := module.AdminCheck.Execute(context.Background(), string(userID))
			if c.want == "" {
				if err != nil {
					t.Fatal(err)
				}
				return
			}
			requireCode(t, err, c.want)
		})
	}
}
