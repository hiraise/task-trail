package admin_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/admin"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	adminID = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	userID  = entity.UserID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx       *mocks.MockTxManager
	users    *mocks.MockUserRepository
	settings *mocks.MockSettingsRepository
	mailer   *mocks.MockMailer
}

func newModule(t *testing.T) (*admin.AdminModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:       mocks.NewMockTxManager(ctrl),
		users:    mocks.NewMockUserRepository(ctrl),
		settings: mocks.NewMockSettingsRepository(ctrl),
		mailer:   mocks.NewMockMailer(ctrl),
	}
	return admin.New(admin.Deps{
		TxManager:    d.tx,
		Clock:        clock.New(now),
		UserRepo:     d.users,
		SettingsRepo: d.settings,
		Mailer:       d.mailer,
	}), d
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	if !domain.HasCode(err, code) {
		t.Fatalf("expected error %s, got %v", code, err)
	}
}

func ptr(s string) *string { return &s }

// expectCurrent: the use case responds with the settings read after the change (ADR-0018).
func (d *deps) expectCurrent(mail *entity.MailSettings) {
	d.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com", nil)
	d.settings.EXPECT().GetMail(gomock.Any()).Return(mail, nil)
}

// The service address is saved without a trailing "/": links are built from it (ADR-0015).
func TestUpdateServiceURL(t *testing.T) {
	module, d := newModule(t)
	gomock.InOrder(
		d.settings.EXPECT().SetServiceURL(gomock.Any(), "https://example.com/tasktrail").Return(nil),
		d.settings.EXPECT().GetServiceURL(gomock.Any()).Return("https://example.com/tasktrail", nil),
	)
	d.settings.EXPECT().GetMail(gomock.Any()).Return(nil, nil)
	got, err := module.UpdateServiceURL.Execute(context.Background(), "https://example.com/tasktrail/")
	if err != nil || got.ServiceURL != "https://example.com/tasktrail" || got.Mail != nil {
		t.Fatalf("settings %+v, %v", got, err)
	}
}

func mailRequest(password *string, passwordSet bool) dto.MailSettings {
	return dto.MailSettings{Host: "smtp.example.com", Port: 587, Encryption: entity.MailEncryptionSTARTTLS,
		Sender: "TaskTrail <noreply@example.com>", Username: ptr("robot"), PasswordSet: passwordSet, Password: password}
}

func savedMail(password *string) *entity.MailSettings {
	return &entity.MailSettings{Host: "smtp.example.com", Port: 587, Encryption: entity.MailEncryptionSTARTTLS,
		Sender: "old@example.com", Username: ptr("robot"), Password: password}
}

// passwordIs matches mail settings with this password; nil means no password.
func passwordIs(password *string) gomock.Matcher {
	return gomock.Cond(func(m *entity.MailSettings) bool {
		return (m.Password == nil) == (password == nil) && (password == nil || *m.Password == *password)
	})
}

// Settings are saved only if a connection with them succeeded; if no password is entered,
// the one saved for the same server and port is used (ADR-0015, ADR-0017).
func TestSaveMail(t *testing.T) {
	cases := []struct {
		name     string
		request  dto.MailSettings
		saved    *entity.MailSettings // nil: saved settings are not read
		password *string              // the password used for the check and saving
	}{
		{name: "new password", request: mailRequest(ptr("new"), true), password: ptr("new")},
		{name: "saved password", request: mailRequest(nil, false), saved: savedMail(ptr("old")), password: ptr("old")},
		{name: "password deleted", request: mailRequest(nil, true)},
		{name: "no authentication", request: func() dto.MailSettings {
			r := mailRequest(ptr("ignored"), true)
			r.Username = nil
			return r
		}()},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			module, d := newModule(t)
			if c.saved != nil {
				d.settings.EXPECT().GetMail(gomock.Any()).Return(c.saved, nil)
			}
			gomock.InOrder(
				d.mailer.EXPECT().Check(gomock.Any(), passwordIs(c.password)).Return(nil),
				d.settings.EXPECT().SaveMail(gomock.Any(), passwordIs(c.password)).DoAndReturn(func(_ context.Context, m *entity.MailSettings) error {
					if m.Host != c.request.Host || m.Sender != c.request.Sender || m.Username != c.request.Username {
						t.Errorf("saved %+v", m)
					}
					return nil
				}),
			)
			d.expectCurrent(savedMail(c.password))
			got, err := module.SaveMail.Execute(context.Background(), c.request)
			if err != nil || got.Mail == nil {
				t.Fatalf("settings %+v, %v", got, err)
			}
		})
	}
}

// No password entered and the saved one cannot be used: SECRET_REQUIRED before connecting (ADR-0015).
func TestSaveMailSecretRequired(t *testing.T) {
	for name, saved := range map[string]*entity.MailSettings{
		"mail not configured": nil,
		"password not saved":  savedMail(nil),
		"another port":        {Host: "smtp.example.com", Port: 465, Username: ptr("robot"), Password: ptr("old")},
	} {
		t.Run(name, func(t *testing.T) {
			module, d := newModule(t)
			d.settings.EXPECT().GetMail(gomock.Any()).Return(saved, nil)
			_, err := module.SaveMail.Execute(context.Background(), mailRequest(nil, false))
			requireCode(t, err, domain.SecretRequired)
		})
	}
}

func TestSaveMailConnectionFailed(t *testing.T) {
	module, d := newModule(t)
	d.mailer.EXPECT().Check(gomock.Any(), gomock.Any()).Return(domain.ErrMailConnectionFailed(errors.New("535 auth failed")))
	_, err := module.SaveMail.Execute(context.Background(), mailRequest(ptr("wrong"), true))
	requireCode(t, err, domain.MailConnectionFailed)
}

// The test email goes to the email of the administrator who requested it.
func TestSendTestMail(t *testing.T) {
	module, d := newModule(t)
	mail := savedMail(ptr("secret"))
	d.settings.EXPECT().GetMail(gomock.Any()).Return(mail, nil)
	d.users.EXPECT().GetByID(gomock.Any(), adminID).Return(&entity.UserAccount{ID: adminID, Email: "admin@example.com", IsAdmin: true}, nil)
	d.mailer.EXPECT().Send(gomock.Any(), mail, gomock.Cond(func(l service.Letter) bool { return l.To == "admin@example.com" })).Return(nil)
	if err := module.SendTestMail.Execute(context.Background(), string(adminID)); err != nil {
		t.Fatal(err)
	}

	module, d = newModule(t)
	d.settings.EXPECT().GetMail(gomock.Any()).Return(nil, nil)
	requireCode(t, module.SendTestMail.Execute(context.Background(), string(adminID)), domain.MailDisabled)
}

// Granting and revoking run under the administrators lock and the user row lock: counting
// and revoking do not diverge (ADR-0014).
func TestSetAdmin(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	gomock.InOrder(
		d.users.EXPECT().LockAdmins(txtest.InTx).Return(nil),
		d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(&entity.UserAccount{ID: userID, IsAdmin: true}, nil),
		d.users.EXPECT().CountAdmins(txtest.InTx).Return(2, nil),
		d.users.EXPECT().Update(txtest.InTx, gomock.Cond(func(u *entity.UserAccount) bool {
			return !u.IsAdmin && u.UpdatedAt.Equal(now)
		})).Return(nil),
	)
	u, err := module.SetAdmin.Execute(context.Background(), string(userID), false)
	if err != nil || u.IsAdmin {
		t.Fatalf("user %+v, %v", u, err)
	}
}

func TestSetAdminRefused(t *testing.T) {
	t.Run("last administrator", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.users.EXPECT().LockAdmins(txtest.InTx).Return(nil)
		d.users.EXPECT().GetForUpdate(txtest.InTx, adminID).Return(&entity.UserAccount{ID: adminID, IsAdmin: true}, nil)
		d.users.EXPECT().CountAdmins(txtest.InTx).Return(1, nil)
		_, err := module.SetAdmin.Execute(context.Background(), string(adminID), false)
		requireCode(t, err, domain.LastAdmin)
	})
	t.Run("no user", func(t *testing.T) {
		module, d := newModule(t)
		txtest.Expect(d.tx)
		d.users.EXPECT().LockAdmins(txtest.InTx).Return(nil)
		d.users.EXPECT().GetForUpdate(txtest.InTx, userID).Return(nil, domain.ErrEntityNotFound(0, nil))
		_, err := module.SetAdmin.Execute(context.Background(), string(userID), true)
		requireCode(t, err, domain.EntityNotFound)
	})
}
