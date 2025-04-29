package postgresql

import (
	"context"
	"task-trail/internal/entity"
)

type AuthenticationRepo struct {
}

func New() *AuthenticationRepo {
	return &AuthenticationRepo{}
}

func (r *AuthenticationRepo) GetUserBy(ctx context.Context, login string) (entity.User, error) {
	return entity.User{Login: login, ID: 1}, nil
}
