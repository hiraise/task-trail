package usecase

import (
	"context"
	customerrors "task-trail/error"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/password"
	"task-trail/internal/repo"
)

type UserUseCase struct {
	txManager  repo.TxManager
	repo       repo.UserRepository
	pwdService password.Service
}

func NewUserUC(txManager repo.TxManager, repo repo.UserRepository, pwdService password.Service) *UserUseCase {
	return &UserUseCase{txManager: txManager, repo: repo, pwdService: pwdService}
}

func (u *UserUseCase) CreateNew(ctx context.Context, email string, password string) error {

	isTaken, err := u.repo.EmailIsTaken(ctx, email)
	if err != nil {
		return err
	}
	if isTaken {
		return customerrors.NewErrConflict(map[string]any{"email": email})
	}

	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		// TODO: replace in separated method or helper utils
		hash, err := u.pwdService.HashPassword(password)
		if err != nil {
			return err
		}

		user := &entity.User{Email: email, PasswordHash: string(hash)}
		if err := u.repo.Create(ctx, user); err != nil {
			return err
		}
		return nil
	})
}
