package usecase

import (
	"context"
	"task-trail/internal/entity"
)

type Authentication interface {
	Authenticate(context.Context, string, string) (entity.User, error)
}

type Registration interface {
	Register(ctx context.Context, login string, password string) error
}
