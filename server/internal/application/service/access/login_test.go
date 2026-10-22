package access_test

import (
	"context"
	"errors"
	"testing"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
)

func TestLogin(t *testing.T) {
	module, d := newModule(t)
	d.expectTx()
	// The use case normalizes the email itself (ADR-0016)
	d.users.EXPECT().GetByEmail(inTx, email).Return(user(), nil)
	d.passwords.EXPECT().ComparePassword("password", passwordHash).Return(true, nil)
	d.expectSession()

	session, err := module.Login.Execute(context.Background(), dto.Credentials{Email: " Ivan@Example.com ", Password: "password"})
	if err != nil {
		t.Fatal(err)
	}
	if session.User.ID != userID || session.UserID != userID || session.AccessToken.Token != "access" {
		t.Fatalf("session: %+v", session)
	}
}

// A missing user and a wrong password are indistinguishable: INVALID_CREDENTIALS.
func TestLoginInvalidCredentials(t *testing.T) {
	t.Run("no user", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.users.EXPECT().GetByEmail(inTx, email).Return(nil, domain.ErrEntityNotFound(0, nil))
		_, err := module.Login.Execute(context.Background(), dto.Credentials{Email: string(email), Password: "password"})
		requireCode(t, err, domain.InvalidCredentials)
	})
	t.Run("wrong password", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.users.EXPECT().GetByEmail(inTx, email).Return(user(), nil)
		d.passwords.EXPECT().ComparePassword("wrong-password", passwordHash).Return(false, nil)
		_, err := module.Login.Execute(context.Background(), dto.Credentials{Email: string(email), Password: "wrong-password"})
		requireCode(t, err, domain.InvalidCredentials)
	})
}

func TestLoginRepositoryError(t *testing.T) {
	module, d := newModule(t)
	d.expectTx()
	d.users.EXPECT().GetByEmail(inTx, email).Return(nil, domain.ErrRepoInternal(0, errors.New("connection reset")))
	_, err := module.Login.Execute(context.Background(), dto.Credentials{Email: string(email), Password: "password"})
	requireCode(t, err, domain.RepoInternal)
}
