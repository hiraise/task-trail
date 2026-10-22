package service

import (
	"context"

	"task-trail/internal/domain/entity"
)

// Letter — a plain-text letter to one recipient.
type Letter struct {
	To      entity.Email
	Subject string
	Text    string
}

// Mailer sends letters via SMTP from the administrator's settings (ADR-0017). Settings
// are passed to every call: changing them takes effect without a restart (ADR-0015).
type Mailer interface {
	// Send returns a MAIL_SEND_FAILED error if SMTP did not accept the letter.
	Send(ctx context.Context, settings *entity.MailSettings, letter Letter) error
	// Check connects to SMTP and signs in if a login is set — without a letter: this way settings
	// are checked before saving (ADR-0017). Failed — MAIL_CONNECTION_FAILED.
	Check(ctx context.Context, settings *entity.MailSettings) error
}
