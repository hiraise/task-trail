package usecase

import (
	"context"
	"task-trail/internal/entity"
)

type Authentication interface {
	Login(ctx context.Context, email string, password string) (entity.User, error)
	Logout(ctx context.Context) error
	Refresh(ctx context.Context) error
}

type User interface {
	CreateNew(ctx context.Context, email string, password string) error
}
