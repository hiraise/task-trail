package notification_test

import (
	"context"
	"errors"
	"net"
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/service/notification"
	"task-trail/test/clock"
	"task-trail/test/smtptest"
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

var letter = service.Letter{
	To:      "ivan@example.com",
	Subject: "Сброс пароля в TaskTrail",
	Text:    "Откройте ссылку:\n\nhttps://example.com/auth/reset?token=ABC\n",
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var e *domain.DomainError
	if !errors.As(err, &e) || e.Code != code {
		t.Fatalf("expected error %s, got %v", code, err)
	}
}

// The email arrives with any encryption; a Russian subject and text are not corrupted, the link arrives whole.
func TestSend(t *testing.T) {
	cases := map[string][]smtptest.Option{
		"no encryption":         nil,
		"STARTTLS with sign-in": {smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret")},
		"TLS with sign-in":      {smtptest.WithTLS(), smtptest.WithAuth("tasktrail", "secret")},
	}
	for name, opts := range cases {
		t.Run(name, func(t *testing.T) {
			smtp := smtptest.New(t, opts...)
			mailer := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs))
			if err := mailer.Send(context.Background(), smtp.Settings(), letter); err != nil {
				t.Fatal(err)
			}
			msg := smtp.Last(t)
			if msg.From != "noreply@tasktrail.test" || len(msg.To) != 1 || msg.To[0] != "ivan@example.com" {
				t.Fatalf("envelope: from %q to %v", msg.From, msg.To)
			}
			if got := msg.Header(t, "Subject"); got != letter.Subject {
				t.Errorf("subject %q", got)
			}
			if got := msg.Header(t, "From"); got != `"TaskTrail" <noreply@tasktrail.test>` {
				t.Errorf("sender %q", got)
			}
			if got := msg.Header(t, "Date"); !strings.Contains(got, "21 Oct 2026 12:00:00") {
				t.Errorf("date is not from the server clock: %q", got)
			}
			if got := strings.ReplaceAll(msg.Text(t), "\r\n", "\n"); got != letter.Text {
				t.Errorf("text %q", got)
			}
		})
	}
}

// An SMTP failure is MAIL_SEND_FAILED, not a lost email.
func TestSendFails(t *testing.T) {
	t.Run("wrong password", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		wrong := "wrong"
		settings.Password = &wrong
		err := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs)).Send(context.Background(), settings, letter)
		requireCode(t, err, domain.MailSendFailed)
	})
	// A server without STARTTLS while STARTTLS is configured: we do not send the email in plain text
	t.Run("no STARTTLS", func(t *testing.T) {
		smtp := smtptest.New(t)
		settings := smtp.Settings()
		settings.Encryption = "starttls"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
		if len(smtp.Messages()) != 0 {
			t.Fatal("the email was sent without encryption")
		}
	})
	// Without encryption the password is not sent in plain text, even if the server asks for PLAIN
	t.Run("sign-in without encryption", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		settings.Encryption = "none"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
	// The SMTP certificate is verified: without a trusted root the email is not sent
	t.Run("untrusted certificate", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS())
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), smtp.Settings(), letter), domain.MailSendFailed)
		if len(smtp.Messages()) != 0 {
			t.Fatal("the email was sent to a server with an untrusted certificate")
		}
	})
	t.Run("server unavailable", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		settings := smtptest.New(t).Settings()
		settings.Port = listener.Addr().(*net.TCPAddr).Port
		_ = listener.Close()
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
	t.Run("invalid sender", func(t *testing.T) {
		settings := smtptest.New(t).Settings()
		settings.Sender = "не адрес"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
}

// Check connects and signs in with any encryption but sends no email (ADR-0017).
func TestCheck(t *testing.T) {
	cases := map[string][]smtptest.Option{
		"no encryption":         nil,
		"STARTTLS with sign-in": {smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret")},
		"TLS with sign-in":      {smtptest.WithTLS(), smtptest.WithAuth("tasktrail", "secret")},
	}
	for name, opts := range cases {
		t.Run(name, func(t *testing.T) {
			smtp := smtptest.New(t, opts...)
			mailer := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs))
			if err := mailer.Check(context.Background(), smtp.Settings()); err != nil {
				t.Fatal(err)
			}
			if n := len(smtp.Messages()); n != 0 {
				t.Fatalf("emails: %d", n)
			}
		})
	}
}

// Failed to connect or sign in — MAIL_CONNECTION_FAILED: such settings are not saved.
func TestCheckFails(t *testing.T) {
	t.Run("wrong password", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		wrong := "wrong"
		settings.Password = &wrong
		err := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs)).Check(context.Background(), settings)
		requireCode(t, err, domain.MailConnectionFailed)
	})
	// Connecting without sign-in succeeds, but the server will not accept the email: MAIL FROM shows it
	t.Run("server requires sign-in, but there is no login", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		settings.Username, settings.Password = nil, nil
		err := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs)).Check(context.Background(), settings)
		requireCode(t, err, domain.MailConnectionFailed)
	})
	t.Run("server rejects the sender", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithRejectedSenders("noreply@tasktrail.test"))
		requireCode(t, notification.NewSMTP(clock.New(now)).Check(context.Background(), smtp.Settings()), domain.MailConnectionFailed)
	})
	t.Run("invalid sender", func(t *testing.T) {
		settings := smtptest.New(t).Settings()
		settings.Sender = "не адрес"
		requireCode(t, notification.NewSMTP(clock.New(now)).Check(context.Background(), settings), domain.MailConnectionFailed)
	})
	t.Run("no STARTTLS", func(t *testing.T) {
		settings := smtptest.New(t).Settings()
		settings.Encryption = "starttls"
		requireCode(t, notification.NewSMTP(clock.New(now)).Check(context.Background(), settings), domain.MailConnectionFailed)
	})
	t.Run("untrusted certificate", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithTLS())
		requireCode(t, notification.NewSMTP(clock.New(now)).Check(context.Background(), smtp.Settings()), domain.MailConnectionFailed)
	})
	t.Run("server unavailable", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		settings := smtptest.New(t).Settings()
		settings.Port = listener.Addr().(*net.TCPAddr).Port
		_ = listener.Close()
		requireCode(t, notification.NewSMTP(clock.New(now)).Check(context.Background(), settings), domain.MailConnectionFailed)
	})
}
