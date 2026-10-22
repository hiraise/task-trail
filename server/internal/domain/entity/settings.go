package entity

import (
	"strings"

	"task-trail/internal/domain"
)

// NewServiceURL normalizes the service URL to the form links are built from (ADR-0015):
// without a trailing "/", otherwise the link would contain "//auth/reset".
func NewServiceURL(raw string) string {
	return strings.TrimRight(raw, "/")
}

// MailEncryption — how the SMTP connection is protected (ADR-0017).
type MailEncryption string

const (
	MailEncryptionNone     MailEncryption = "none"
	MailEncryptionSTARTTLS MailEncryption = "starttls"
	MailEncryptionTLS      MailEncryption = "tls"
)

// MailSettings — the SMTP connection the administrator sets in the UI (ADR-0017).
type MailSettings struct {
	Host       string
	Port       int
	Encryption MailEncryption
	Sender     string
	// Username — nil if SMTP accepts mail without sign-in.
	Username *string
	// Password — nil if there is no password or it failed to decrypt: a secret that
	// does not decrypt is treated as not set (ADR-0015).
	Password *string
}

// KeepPassword takes the password from the saved settings saved when the administrator did not enter a new one.
// A saved secret goes only where it was entered for (ADR-0015): the server or port changed,
// there is no password or it failed to decrypt — SECRET_REQUIRED, the password is entered again.
// Without SMTP sign-in the password is not needed and not saved.
func (s *MailSettings) KeepPassword(saved *MailSettings) error {
	if s.Username == nil {
		s.Password = nil
		return nil
	}
	if saved == nil || saved.Password == nil || !strings.EqualFold(saved.Host, s.Host) || saved.Port != s.Port {
		return domain.ErrSecretRequired("host", s.Host, "port", s.Port)
	}
	s.Password = saved.Password
	return nil
}
