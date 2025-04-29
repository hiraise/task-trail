package repo

import (
	"context"
	"task-trail/internal/entity"
)

type AuthenticationRepo interface {
	GetUserBy(context.Context, string) (entity.User, error)
}
