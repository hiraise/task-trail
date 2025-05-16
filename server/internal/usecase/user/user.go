package user

import (
	"task-trail/internal/pkg/password"
	"task-trail/internal/repo"
)

type UseCase struct {
	txManager  repo.TxManager
	repo       repo.UserRepository
	pwdService password.Service
}

func New(txManager repo.TxManager, repo repo.UserRepository, pwdService password.Service) *UseCase {
	return &UseCase{txManager: txManager, repo: repo, pwdService: pwdService}
}
