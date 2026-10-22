package access_test

import (
	"bytes"
	"context"
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"

	"go.uber.org/mock/gomock"
)

var mailSettings = &entity.MailSettings{Host: "smtp.example.com", Port: 587, Encryption: entity.MailEncryptionSTARTTLS, Sender: "noreply@example.com"}

// The email is sent within the request with a link built from the service address; the database holds only its token hash.
func TestForgotPassword(t *testing.T) {
	module, d := newModule(t)
	d.settings.EXPECT().GetMail(gomock.Any()).Return(mailSettings, nil)
	d.users.EXPECT().GetByEmail(gomock.Any(), email).Return(user(), nil)
	d.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com/tasktrail", nil)
	var stored *entity.PasswordReset
	d.resets.EXPECT().Create(gomock.Any(), gomock.Any()).DoAndReturn(func(_ context.Context, r *entity.PasswordReset) error {
		stored = r
		return nil
	})
	var sent service.Letter
	d.mailer.EXPECT().Send(gomock.Any(), mailSettings, gomock.Any()).DoAndReturn(func(_ context.Context, _ *entity.MailSettings, l service.Letter) error {
		sent = l
		return nil
	})

	if err := module.ForgotPassword.Execute(context.Background(), " Ivan@Example.com "); err != nil {
		t.Fatal(err)
	}
	if stored.UserID != userID || !stored.ExpiredAt.Equal(now.Add(resetLifetime)) {
		t.Fatalf("link in the database: %+v", stored)
	}
	if sent.To != email || !strings.Contains(sent.Text, "24 часа") {
		t.Fatalf("email: %+v", sent)
	}
	token := linkToken(t, sent.Text, "https://example.com/tasktrail/auth/reset?token=")
	if !bytes.Equal(entity.HashLinkToken(token), stored.TokenHash) {
		t.Fatal("the database does not hold the hash of the link token")
	}
}

// linkToken finds a link with the given prefix in the text and returns its token.
func linkToken(t *testing.T, text, prefix string) string {
	t.Helper()
	start := strings.Index(text, prefix)
	if start < 0 {
		t.Fatalf("no link %s in the text:\n%s", prefix, text)
	}
	link, _, _ := strings.Cut(text[start:], "\n")
	u, err := url.Parse(link)
	if err != nil || u.Query().Get("token") == "" {
		t.Fatalf("link %q has no token", link)
	}
	return u.Query().Get("token")
}

func TestForgotPasswordWithoutLetter(t *testing.T) {
	t.Run("mail not configured", func(t *testing.T) {
		module, d := newModule(t)
		d.settings.EXPECT().GetMail(gomock.Any()).Return(nil, nil)
		requireCode(t, module.ForgotPassword.Execute(context.Background(), string(email)), domain.MailDisabled)
	})
	// The response is the same as after sending: it does not reveal whether the email is registered
	t.Run("email not registered", func(t *testing.T) {
		module, d := newModule(t)
		d.settings.EXPECT().GetMail(gomock.Any()).Return(mailSettings, nil)
		d.users.EXPECT().GetByEmail(gomock.Any(), email).Return(nil, domain.ErrEntityNotFound(0, nil))
		if err := module.ForgotPassword.Execute(context.Background(), string(email)); err != nil {
			t.Fatal(err)
		}
	})
	t.Run("SMTP rejected the email", func(t *testing.T) {
		module, d := newModule(t)
		d.settings.EXPECT().GetMail(gomock.Any()).Return(mailSettings, nil)
		d.users.EXPECT().GetByEmail(gomock.Any(), email).Return(user(), nil)
		d.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com", nil)
		d.resets.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
		d.mailer.EXPECT().Send(gomock.Any(), mailSettings, gomock.Any()).Return(domain.ErrMailSendFailed(errors.New("535 auth failed")))
		requireCode(t, module.ForgotPassword.Execute(context.Background(), string(email)), domain.MailSendFailed)
	})
}

const resetToken = "RESETTOKEN"

func storedReset(expiredAt time.Time) *entity.PasswordReset {
	return &entity.PasswordReset{TokenHash: entity.HashLinkToken(resetToken), UserID: userID, ExpiredAt: expiredAt, CreatedAt: expiredAt.Add(-resetLifetime)}
}

var resetData = dto.ResetPassword{Token: resetToken, Password: "new-password"}

// A reset changes the password, voids all reset links and closes all sessions, in one transaction.
func TestResetPassword(t *testing.T) {
	module, d := newModule(t)
	d.expectTx()
	d.resets.EXPECT().GetForUpdate(inTx, entity.HashLinkToken(resetToken)).Return(storedReset(now.Add(time.Minute)), nil)
	d.users.EXPECT().GetForUpdate(inTx, userID).Return(user(), nil)
	d.passwords.EXPECT().HashPassword("new-password").Return("$2a$12$new", nil)
	d.users.EXPECT().Update(inTx, gomock.Any()).DoAndReturn(func(_ context.Context, u *entity.UserAccount) error {
		if u.PasswordHash != "$2a$12$new" || !u.UpdatedAt.Equal(now) {
			t.Errorf("user: %+v", u)
		}
		return nil
	})
	d.resets.EXPECT().DeleteByUser(inTx, userID).Return(nil)
	d.tokens.EXPECT().RevokeAll(inTx, userID, now).Return(nil)
	if err := module.ResetPassword.Execute(context.Background(), resetData); err != nil {
		t.Fatal(err)
	}
}

func TestResetPasswordLinkInvalid(t *testing.T) {
	t.Run("no link", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.resets.EXPECT().GetForUpdate(inTx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
		requireCode(t, module.ResetPassword.Execute(context.Background(), resetData), domain.LinkInvalid)
	})
	t.Run("expired", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.resets.EXPECT().GetForUpdate(inTx, gomock.Any()).Return(storedReset(now), nil)
		requireCode(t, module.ResetPassword.Execute(context.Background(), resetData), domain.LinkInvalid)
	})
	t.Run("no user", func(t *testing.T) {
		module, d := newModule(t)
		d.expectTx()
		d.resets.EXPECT().GetForUpdate(inTx, gomock.Any()).Return(storedReset(now.Add(time.Minute)), nil)
		d.users.EXPECT().GetForUpdate(inTx, userID).Return(nil, domain.ErrEntityNotFound(0, nil))
		requireCode(t, module.ResetPassword.Execute(context.Background(), resetData), domain.LinkInvalid)
	})
}

// The administrator gets a reset link for a user by ID: built from the service address, the database holds
// its token hash (ADR-0017).
func TestPasswordResetLinkForUser(t *testing.T) {
	module, d := newModule(t)
	d.users.EXPECT().GetByID(gomock.Any(), userID).Return(user(), nil)
	d.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com/tasktrail", nil)
	var stored *entity.PasswordReset
	d.resets.EXPECT().Create(gomock.Any(), gomock.Any()).DoAndReturn(func(_ context.Context, r *entity.PasswordReset) error {
		stored = r
		return nil
	})
	link, err := module.PasswordResetLink.ForUser(context.Background(), string(userID))
	if err != nil {
		t.Fatal(err)
	}
	if stored.UserID != userID || !link.ExpiresAt.Equal(now.Add(resetLifetime)) {
		t.Fatalf("link %+v, in the database %+v", link, stored)
	}
	token := linkToken(t, link.URL, "https://example.com/tasktrail/auth/reset?token=")
	if !bytes.Equal(entity.HashLinkToken(token), stored.TokenHash) {
		t.Fatal("the database does not hold the hash of the link token")
	}

	module, d = newModule(t)
	d.users.EXPECT().GetByID(gomock.Any(), userID).Return(nil, domain.ErrEntityNotFound(0, nil))
	_, err = module.PasswordResetLink.ForUser(context.Background(), string(userID))
	requireCode(t, err, domain.EntityNotFound)
}
