package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, entity *entity.RefreshToken) error
	GetUserToken(ctx context.Context, tokenID entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error)
	Update(ctx context.Context, entity *entity.RefreshToken) error
	// GetAllUserTokens(ctx context.Context, userID entity.UserID) ([]*entity.RefreshToken, error)
}
