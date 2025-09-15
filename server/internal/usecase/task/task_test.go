package task_test

import (
	"context"
	"task-trail/internal/customerrors"
	"task-trail/internal/usecase/task"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

type testDeps struct {
	txManager        mocks.MockTxManager
	projectUC        mocks.MockProject
	proejctRepo      mocks.MockProjectRepository
	taskRepo         mocks.MockTaskRepository
	notificationRepo mocks.MockNotificationRepository
	errHandler       customerrors.ErrorHandler
}

func mockDependencies(ctrl *gomock.Controller) (*task.UseCase, *testDeps) {
	projectRepo := mocks.NewMockProjectRepository(ctrl)
	txManager := mocks.NewMockTxManager(ctrl)
	errHandler := customerrors.NewErrHander()
	projectUC := mocks.NewMockProject(ctrl)
	taskRepo := mocks.NewMockTaskRepository(ctrl)
	notificationRepo := mocks.NewMockNotificationRepository(ctrl)
	uc := task.New(txManager, projectUC, projectRepo, taskRepo, notificationRepo, errHandler)
	deps := &testDeps{
		txManager:        *txManager,
		projectUC:        *projectUC,
		proejctRepo:      *projectRepo,
		taskRepo:         *taskRepo,
		notificationRepo: *notificationRepo,
		errHandler:       errHandler,
	}
	return uc, deps
}

// TODO: replace in test helper
func mockTx(ctx context.Context, txManager mocks.MockTxManager) {
	txManager.EXPECT().DoWithTx(ctx, gomock.Any()).
		DoAndReturn(
			func(ctx context.Context, f func(ctx context.Context) error) error {
				return f(ctx)
			},
		)
}
