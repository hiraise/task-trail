package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// SettingsRepository stores service settings set by the administrator (ADR-0015).
type SettingsRepository interface {
	// GetServiceURL returns the service URL or an empty string while it is not set.
	GetServiceURL(ctx context.Context) (string, error)
	SetServiceURL(ctx context.Context, url string) error
	// GetMail returns the mail settings or nil if mail is not connected.
	GetMail(ctx context.Context) (*entity.MailSettings, error)
	SaveMail(ctx context.Context, settings *entity.MailSettings) error
	DeleteMail(ctx context.Context) error
}
