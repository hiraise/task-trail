package dto

import "task-trail/internal/domain/entity"

// ServiceSettings — настройки сервиса для администратора (ADR-0015).
type ServiceSettings struct {
	ServiceURL string
	// Mail — nil, если почта не подключена.
	Mail *entity.MailSettings
}

// MailSettings — настройки почты из запроса администратора (ADR-0017).
type MailSettings struct {
	Host       string
	Port       int
	Encryption entity.MailEncryption
	Sender     string
	// Username — nil, если SMTP принимает почту без входа.
	Username *string
	// PasswordSet — пароль передан в запросе; Password — nil, если передан null: удалить пароль.
	PasswordSet bool
	Password    *string
}
