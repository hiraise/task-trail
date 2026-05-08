package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type UserRepository interface {
	Create(ctx context.Context, entity *entity.UserAccount) error
	Update(ctx context.Context, entity *entity.UserAccount) error
	GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	GetByEmail(ctx context.Context, email entity.Email) (*entity.UserAccount, error)
	ExistsByEmail(ctx context.Context, email entity.Email) (bool, error)
}
