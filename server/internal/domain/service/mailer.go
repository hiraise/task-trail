package service

import (
	"context"

	"task-trail/internal/domain/entity"
)

// Letter — письмо одному получателю, обычный текст.
type Letter struct {
	To      entity.Email
	Subject string
	Text    string
}

// Mailer отправляет письма через SMTP из настроек администратора (ADR-0017). Настройки
// передаются в каждый вызов: их смена действует без перезапуска (ADR-0015).
type Mailer interface {
	// Send возвращает ошибку MAIL_SEND_FAILED, если SMTP не принял письмо.
	Send(ctx context.Context, settings *entity.MailSettings, letter Letter) error
}
