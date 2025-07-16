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

func mockUseCase(ctrl *gomock.Controller) (*project.UseCase, *testDeps) {
	projectRepo := mocks.NewMockProjectRepository(ctrl)
	userRepo := mocks.NewMockUserRepository(ctrl)
	txManager := mocks.NewMockTxManager(ctrl)
	errHandler := customerrors.NewErrHander()
	mockAuhtUC := mocks.NewMockAuthentication(ctrl)
	mockNotificationRepo := mocks.NewMockNotificationRepository(ctrl)
	uc := project.New(txManager, mockAuhtUC, projectRepo, userRepo, mockNotificationRepo, errHandler)
	deps := &testDeps{
		authUC:           *mockAuhtUC,
		txManager:        *txManager,
		projectRepo:      *projectRepo,
		userRepo:         *userRepo,
		notificationRepo: *mockNotificationRepo,
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
