package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

type PasswordResetRepository interface {
	Create(ctx context.Context, reset *entity.PasswordReset) error
	// GetForUpdate читает ссылку по хешу токена и блокирует её строку до конца транзакции:
	// два одновременных сброса по одной ссылке не пройдут оба.
	GetForUpdate(ctx context.Context, hash entity.LinkTokenHash) (*entity.PasswordReset, error)
	// DeleteByUser удаляет все ссылки сброса пользователя.
	DeleteByUser(ctx context.Context, userID entity.UserID) error
	// DeleteExpired удаляет ссылки, истёкшие к моменту now, и возвращает, сколько удалено.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
