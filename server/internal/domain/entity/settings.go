package entity

import (
	"strings"

	"task-trail/internal/domain"
)

// NewServiceURL приводит адрес сервиса к виду, от которого строятся ссылки (ADR-0015):
// без «/» в конце, иначе в ссылке будет «//auth/reset».
func NewServiceURL(raw string) string {
	return strings.TrimRight(raw, "/")
}

// MailEncryption — как защищено соединение с SMTP (ADR-0017).
type MailEncryption string

const (
	MailEncryptionNone     MailEncryption = "none"
	MailEncryptionSTARTTLS MailEncryption = "starttls"
	MailEncryptionTLS      MailEncryption = "tls"
)

// MailSettings — подключение к SMTP, которое администратор задаёт в интерфейсе (ADR-0017).
type MailSettings struct {
	Host       string
	Port       int
	Encryption MailEncryption
	Sender     string
	// Username — nil, если SMTP принимает почту без входа.
	Username *string
	// Password — nil, если пароля нет или он не расшифровался: секрет, который
	// не расшифровывается, считается не заданным (ADR-0015).
	Password *string
}

// KeepPassword ставит пароль из сохранённых настроек saved, когда администратор не ввёл новый.
// Сохранённый секрет уходит только туда, для чего его ввели (ADR-0015): сменились сервер
// или порт, пароля нет или он не расшифровался — SECRET_REQUIRED, пароль вводится заново.
// Без входа на SMTP пароль не нужен и не сохраняется.
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
