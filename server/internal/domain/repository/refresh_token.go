package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, entity *entity.RefreshToken) error
	// GetForUpdate читает токен пользователя и блокирует его строку до конца транзакции:
	// параллельный обмен того же токена ждёт и видит, что токен уже обменян.
	GetForUpdate(ctx context.Context, tokenID entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error)
	Update(ctx context.Context, entity *entity.RefreshToken) error
	// RevokeAll закрывает все действующие сессии пользователя.
	RevokeAll(ctx context.Context, userID entity.UserID, now time.Time) error
	// DeleteExpired удаляет токены, истёкшие к моменту now, и возвращает, сколько удалено.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
