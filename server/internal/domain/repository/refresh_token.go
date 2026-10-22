package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, entity *entity.RefreshToken) error
	// GetForUpdate reads the user's token and locks its row until the end of the transaction:
	// a parallel exchange of the same token waits and sees that the token is already exchanged.
	GetForUpdate(ctx context.Context, tokenID entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error)
	Update(ctx context.Context, entity *entity.RefreshToken) error
	// RevokeAll closes all active sessions of the user.
	RevokeAll(ctx context.Context, userID entity.UserID, now time.Time) error
	// DeleteExpired deletes tokens expired by now and returns how many were deleted.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
