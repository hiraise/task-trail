package task

import (
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"
)

type UseCase struct {
	txManager        repo.TxManager
	projectUC        usecase.Project
	projectRepo      repo.ProjectRepository
	taskRepo         repo.TaskRepository
	notificationRepo repo.NotificationRepository
	errHandler       customerrors.ErrorHandler
}

func New(
	txManager repo.TxManager,
	projectUC usecase.Project,
	projectRepo repo.ProjectRepository,
	taskRepo repo.TaskRepository,
	notificationRepo repo.NotificationRepository,
	errHandler customerrors.ErrorHandler,
) *UseCase {
	return &UseCase{

		txManager:        txManager,
		projectUC:        projectUC,
		projectRepo:      projectRepo,
		taskRepo:         taskRepo,
		notificationRepo: notificationRepo,
		errHandler:       errHandler,
	}
}
