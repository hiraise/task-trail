package project_test

import (
	"context"
	"task-trail/internal/customerrors"
	"task-trail/internal/usecase/project"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

type testDeps struct {
	authUC           mocks.MockAuthentication
	userRepo         mocks.MockUserRepository
	projectRepo      mocks.MockProjectRepository
	notificationRepo mocks.MockNotificationRepository
	txManager        mocks.MockTxManager
	errHandler       customerrors.ErrorHandler
}

func mockDependencies(ctrl *gomock.Controller) (*project.UseCase, *testDeps) {
	projectRepo := mocks.NewMockProjectRepository(ctrl)
	userRepo := mocks.NewMockUserRepository(ctrl)
	txManager := mocks.NewMockTxManager(ctrl)
	errHandler := customerrors.NewErrHander()
	authUC := mocks.NewMockAuthentication(ctrl)
	notificationRepo := mocks.NewMockNotificationRepository(ctrl)
	uc := project.New(txManager, authUC, projectRepo, userRepo, notificationRepo, errHandler)
	deps := &testDeps{
		authUC:           *authUC,
		txManager:        *txManager,
		projectRepo:      *projectRepo,
		userRepo:         *userRepo,
		notificationRepo: *notificationRepo,
		errHandler:       errHandler,
	}
	return uc, deps
}

func mockTx(ctx context.Context, txManager mocks.MockTxManager) {
	txManager.EXPECT().DoWithTx(ctx, gomock.Any()).
		DoAndReturn(
			func(ctx context.Context, f func(ctx context.Context) error) error {
				return f(ctx)
			},
		)
}
