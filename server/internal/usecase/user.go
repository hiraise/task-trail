package usecase

import (
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
