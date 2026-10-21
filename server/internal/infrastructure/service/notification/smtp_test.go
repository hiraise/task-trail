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
		t.Fatalf("ожидалась ошибка %s, получено %v", code, err)
	}
}

// Письмо доходит при любом шифровании; тема и текст по-русски не портятся, ссылка — целиком.
func TestSend(t *testing.T) {
	cases := map[string][]smtptest.Option{
		"без шифрования":      nil,
		"STARTTLS со входом": {smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret")},
		"TLS со входом":      {smtptest.WithTLS(), smtptest.WithAuth("tasktrail", "secret")},
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
				t.Fatalf("конверт: от %q кому %v", msg.From, msg.To)
			}
			if got := msg.Header(t, "Subject"); got != letter.Subject {
				t.Errorf("тема %q", got)
			}
			if got := msg.Header(t, "From"); got != `"TaskTrail" <noreply@tasktrail.test>` {
				t.Errorf("отправитель %q", got)
			}
			if got := msg.Header(t, "Date"); !strings.Contains(got, "21 Oct 2026 12:00:00") {
				t.Errorf("дата не с часов сервера: %q", got)
			}
			if got := strings.ReplaceAll(msg.Text(t), "\r\n", "\n"); got != letter.Text {
				t.Errorf("текст %q", got)
			}
		})
	}
}

// Отказ SMTP — MAIL_SEND_FAILED, а не потерянное письмо.
func TestSendFails(t *testing.T) {
	t.Run("неверный пароль", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS(), smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		wrong := "wrong"
		settings.Password = &wrong
		err := notification.NewSMTP(clock.New(now), notification.WithRootCAs(smtp.RootCAs)).Send(context.Background(), settings, letter)
		requireCode(t, err, domain.MailSendFailed)
	})
	// Сервер без STARTTLS при настройке STARTTLS — не шлём письмо открытым текстом
	t.Run("нет STARTTLS", func(t *testing.T) {
		smtp := smtptest.New(t)
		settings := smtp.Settings()
		settings.Encryption = "starttls"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
		if len(smtp.Messages()) != 0 {
			t.Fatal("письмо ушло без шифрования")
		}
	})
	// Без шифрования пароль открытым текстом не отправляется, даже если сервер просит PLAIN
	t.Run("вход без шифрования", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithAuth("tasktrail", "secret"))
		settings := smtp.Settings()
		settings.Encryption = "none"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
	// Сертификат SMTP проверяется: без доверенного корня письмо не уходит
	t.Run("чужой сертификат", func(t *testing.T) {
		smtp := smtptest.New(t, smtptest.WithSTARTTLS())
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), smtp.Settings(), letter), domain.MailSendFailed)
		if len(smtp.Messages()) != 0 {
			t.Fatal("письмо ушло на сервер с недоверенным сертификатом")
		}
	})
	t.Run("сервер недоступен", func(t *testing.T) {
		listener, err := net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		settings := smtptest.New(t).Settings()
		settings.Port = listener.Addr().(*net.TCPAddr).Port
		_ = listener.Close()
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
	t.Run("неверный отправитель", func(t *testing.T) {
		settings := smtptest.New(t).Settings()
		settings.Sender = "не адрес"
		requireCode(t, notification.NewSMTP(clock.New(now)).Send(context.Background(), settings, letter), domain.MailSendFailed)
	})
}
