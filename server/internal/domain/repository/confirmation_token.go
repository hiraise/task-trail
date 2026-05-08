package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type ConfirmationTokenFilter struct {
	UserID         *entity.UserID
	ID             *entity.ConfirmationTokenID
	ExcludeUsed    bool
	ExcludeExpired bool
	Purpose        entity.ConfirmationTokenPurpose
}

type ConfirmationTokenRepository interface {
	Create(ctx context.Context, entity *entity.ConfirmationToken) error
	Update(ctx context.Context, enitity *entity.ConfirmationToken) error
	GetByID(ctx context.Context, tokenID entity.ConfirmationTokenID) (*entity.ConfirmationToken, error)
	Find(ctx context.Context, filter ConfirmationTokenFilter) ([]*entity.ConfirmationToken, error)
}
