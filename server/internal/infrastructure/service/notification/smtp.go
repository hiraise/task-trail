// Package notification отправляет письма через SMTP, который подключил администратор (ADR-0017).
package notification

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"

	"github.com/wneessen/go-mail"
)

// Timeout — сколько ждать ответа SMTP на каждом шаге. Письма уходят прямо в запросе API
// (ADR-0017), а веб ждёт такие запросы не меньше 20 секунд (docs/roadmap.md, шаг 6 этапа 1).
const Timeout = 10 * time.Second

type SMTP struct {
	clock   service.Clock
	rootCAs *x509.CertPool
}

type Option func(*SMTP)

// WithRootCAs задаёт корневые сертификаты для TLS вместо системных. Только для тестов:
// их SMTP-сервер подписан своим сертификатом.
func WithRootCAs(pool *x509.CertPool) Option {
	return func(s *SMTP) { s.rootCAs = pool }
}

func NewSMTP(clock service.Clock, opts ...Option) *SMTP {
	s := &SMTP{clock: clock}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// Send подключается к SMTP по настройкам и отправляет письмо. Любой отказ — MAIL_SEND_FAILED
// с причиной: её видно в логе сервера.
func (s *SMTP) Send(ctx context.Context, settings *entity.MailSettings, letter service.Letter) error {
	msg := mail.NewMsg(mail.WithNoDefaultUserAgent())
	if err := msg.From(settings.Sender); err != nil {
		return domain.ErrMailSendFailed(err, "reason", "invalid sender", "sender", settings.Sender)
	}
	if err := msg.To(string(letter.To)); err != nil {
		return domain.ErrMailSendFailed(err, "reason", "invalid recipient", "to", letter.To)
	}
	msg.Subject(letter.Subject)
	msg.SetDateWithValue(s.clock.Now())
	msg.SetMessageID()
	msg.SetBodyString(mail.TypeTextPlain, letter.Text)

	client, err := mail.NewClient(settings.Host, s.options(settings)...)
	if err != nil {
		return domain.ErrMailSendFailed(err, "host", settings.Host, "port", settings.Port)
	}
	if err := client.DialAndSendWithContext(ctx, msg); err != nil {
		return domain.ErrMailSendFailed(err, "host", settings.Host, "port", settings.Port, "to", letter.To)
	}
	return nil
}

func (s *SMTP) options(settings *entity.MailSettings) []mail.Option {
	opts := []mail.Option{mail.WithPort(settings.Port), mail.WithTimeout(Timeout)}
	switch settings.Encryption {
	case entity.MailEncryptionTLS:
		opts = append(opts, mail.WithSSL())
	case entity.MailEncryptionSTARTTLS:
		// Без STARTTLS у сервера письмо не уходит: пароль и ссылки открытым текстом не шлём
		opts = append(opts, mail.WithTLSPolicy(mail.TLSMandatory))
	default:
		opts = append(opts, mail.WithTLSPolicy(mail.NoTLS))
	}
	if s.rootCAs != nil {
		opts = append(opts, mail.WithTLSConfig(&tls.Config{ServerName: settings.Host, RootCAs: s.rootCAs, MinVersion: tls.VersionTLS12}))
	}
	if settings.Username != nil {
		// Без шифрования go-mail выбирает только способы входа, которые не передают пароль
		// открытым текстом; PLAIN и LOGIN — только после TLS
		opts = append(opts, mail.WithSMTPAuth(mail.SMTPAuthAutoDiscover), mail.WithUsername(*settings.Username))
		if settings.Password != nil {
			opts = append(opts, mail.WithPassword(*settings.Password))
		}
	}
	return opts
}
