package authentication

import (
	"context"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
)

type UseCase struct {
	repo repo.AuthenticationRepo
}

func New(r repo.AuthenticationRepo) *UseCase {
	return &UseCase{repo: r}
}

func (u *UseCase) Authenticate(ctx context.Context, login string, password string) (entity.User, error) {
	user, err := u.repo.GetUserBy(ctx, login)
	if err != nil {
		return entity.User{}, err
	}
	return user, nil
}
