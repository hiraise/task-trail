package access_test

import (
	"context"
	"fmt"
	"testing"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"go.uber.org/mock/gomock"
)

var registerData = dto.Register{
	Email:      string(email),
	Password:   "password",
	Username:   "Иван",
	ServiceURL: "https://example.com/tasktrail/",
}

// The first account is an administrator, verified right away, the service address is saved without a trailing "/";
// the check and creation run under the registration lock inside a transaction.
func TestRegisterFirstAccount(t *testing.T) {
	module, d := newModule(t)
	d.passwords.EXPECT().HashPassword("password").Return(passwordHash, nil)
	d.expectTx()
	gomock.InOrder(
		d.users.EXPECT().LockRegistration(inTx).Return(nil),
		d.users.EXPECT().Any(inTx).Return(false, nil),
		d.users.EXPECT().Create(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
			if u.Email != email || u.PasswordHash != passwordHash || *u.Username != "Иван" || !u.IsAdmin ||
				u.VerifiedAt == nil || !u.CreatedAt.Equal(now) {
				return fmt.Errorf("user: %+v", u)
			}
			return nil
		}),
		d.settings.EXPECT().SetServiceURL(inTx, "https://example.com/tasktrail").Return(nil),
	)
	d.tokens.EXPECT().Create(inTx, gomock.Any()).Return(nil)
	d.jwt.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(issued("access"), issued("refresh"), nil)

	session, err := module.Registration.Execute(context.Background(), registerData)
	if err != nil {
		t.Fatal(err)
	}
	if !session.User.IsAdmin || session.AccessToken.Token != "access" || session.RefreshToken.Token != "refresh" ||
		session.UserID != session.User.ID {
		t.Fatalf("session: %+v", session)
	}
}

func TestRegisterWhenUsersExist(t *testing.T) {
	module, d := newModule(t)
	d.passwords.EXPECT().HashPassword(gomock.Any()).Return(passwordHash, nil)
	d.expectTx()
	d.users.EXPECT().LockRegistration(inTx).Return(nil)
	d.users.EXPECT().Any(inTx).Return(true, nil)

	_, err := module.Registration.Execute(context.Background(), registerData)
	requireCode(t, err, domain.RegistrationClosed)
}
