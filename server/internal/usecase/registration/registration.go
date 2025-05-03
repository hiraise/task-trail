package registration

import (
	"context"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
)

type UseCase struct {
	txManager repo.TxManager
	repo      repo.UserRepository
}

func New(txManager repo.TxManager, repo repo.UserRepository) *UseCase {
	return &UseCase{txManager: txManager, repo: repo}
}

func (u *UseCase) Register(ctx context.Context, login string, password string) error {

	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		user := &entity.User{Email: login, PasswordHash: password}
		if err := u.repo.Create(ctx, user); err != nil {
			return err
		}
		return nil
	})
}
