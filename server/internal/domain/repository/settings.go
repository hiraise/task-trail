package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// SettingsRepository хранит настройки сервиса, которые задаёт администратор (ADR-0015).
type SettingsRepository interface {
	// GetServiceURL возвращает адрес сервиса или пустую строку, пока он не задан.
	GetServiceURL(ctx context.Context) (string, error)
	SetServiceURL(ctx context.Context, url string) error
	// GetMail возвращает настройки почты или nil, если почта не подключена.
	GetMail(ctx context.Context) (*entity.MailSettings, error)
	SaveMail(ctx context.Context, settings *entity.MailSettings) error
	DeleteMail(ctx context.Context) error
}
