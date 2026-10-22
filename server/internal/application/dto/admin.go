package dto

import "task-trail/internal/domain/entity"

// ServiceSettings are the service settings for the administrator (ADR-0015).
type ServiceSettings struct {
	ServiceURL string
	// Mail is nil if mail is not configured.
	Mail *entity.MailSettings
}

// MailSettings are the mail settings from an administrator request (ADR-0017).
type MailSettings struct {
	Host       string
	Port       int
	Encryption entity.MailEncryption
	Sender     string
	// Username is nil if SMTP accepts mail without authentication.
	Username *string
	// PasswordSet means the password is in the request; Password is nil if null was sent: delete the password.
	PasswordSet bool
	Password    *string
}
