// Package notification sends emails through the SMTP server the administrator connected (ADR-0017).
package notification

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	netmail "net/mail"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"

	"github.com/wneessen/go-mail"
)

// Timeout is how long to wait for an SMTP reply at each step. Emails are sent right inside the API
// request (ADR-0017), and the web waits for such requests at least 20 seconds (docs/roadmap.md, stage 1 step 6).
const Timeout = 10 * time.Second

type SMTP struct {
	clock   service.Clock
	rootCAs *x509.CertPool
}

type Option func(*SMTP)

// WithRootCAs sets the root certificates for TLS instead of the system ones. Tests only:
// their SMTP server uses a self-signed certificate.
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

// Send connects to SMTP with the settings and sends the email. Any failure is MAIL_SEND_FAILED
// with a cause that shows up in the server log.
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

// Check connects to SMTP with the settings: greeting, encryption, sign-in — and asks whether
// the server accepts mail from the sender (MAIL FROM, then RSET): this shows that the server
// requires sign-in or rejects a foreign sender address. No email is sent. Any failure is
// MAIL_CONNECTION_FAILED with a cause for the server log.
func (s *SMTP) Check(ctx context.Context, settings *entity.MailSettings) error {
	fail := func(err error, reason string) error {
		return domain.ErrMailConnectionFailed(err, "reason", reason, "host", settings.Host, "port", settings.Port)
	}
	sender, err := netmail.ParseAddress(settings.Sender)
	if err != nil {
		return fail(err, "invalid sender")
	}
	client, err := mail.NewClient(settings.Host, s.options(settings)...)
	if err != nil {
		return fail(err, "invalid settings")
	}
	conn, err := client.DialToSMTPClientWithContext(ctx)
	if err != nil {
		return fail(err, "connection or login failed")
	}
	// A failure on QUIT does not spoil the check: the server has already answered everything needed
	defer func() { _ = client.CloseWithSMTPClient(conn) }()
	// The envelope uses the address without a name, as go-mail sends it
	if err := conn.Mail((&netmail.Address{Address: sender.Address}).String()); err != nil {
		return fail(err, "sender rejected")
	}
	if err := conn.Reset(); err != nil {
		return fail(err, "reset failed")
	}
	return nil
}

func (s *SMTP) options(settings *entity.MailSettings) []mail.Option {
	opts := []mail.Option{mail.WithPort(settings.Port), mail.WithTimeout(Timeout)}
	switch settings.Encryption {
	case entity.MailEncryptionTLS:
		opts = append(opts, mail.WithSSL())
	case entity.MailEncryptionSTARTTLS:
		// If the server lacks STARTTLS, no email is sent: we do not send the password and links in plain text
		opts = append(opts, mail.WithTLSPolicy(mail.TLSMandatory))
	default:
		opts = append(opts, mail.WithTLSPolicy(mail.NoTLS))
	}
	if s.rootCAs != nil {
		opts = append(opts, mail.WithTLSConfig(&tls.Config{ServerName: settings.Host, RootCAs: s.rootCAs, MinVersion: tls.VersionTLS12}))
	}
	if settings.Username != nil {
		// Without encryption go-mail picks only sign-in methods that do not send the password
		// in plain text; PLAIN and LOGIN only after TLS
		opts = append(opts, mail.WithSMTPAuth(mail.SMTPAuthAutoDiscover), mail.WithUsername(*settings.Username))
		if settings.Password != nil {
			opts = append(opts, mail.WithPassword(*settings.Password))
		}
	}
	return opts
}
