package auth_test

import (
	"context"
	"fmt"
	"task-trail/internal/customerrors"
	"task-trail/internal/usecase/auth"
	"task-trail/test/mocks"

	"go.uber.org/mock/gomock"
)

const testPwd = "password"
const testEmail = "test@test.test"

type testDeps struct {
	userRepo         mocks.MockUserRepository
	rtRepo           mocks.MockRefreshTokenRepository
	etRepo           mocks.MockEmailTokenRepository
	txManager        mocks.MockTxManager
	notificationRepo mocks.MockNotificationRepository
	passwordSvc      mocks.MockPasswordService
	tokenSvc         mocks.MockTokenService
	errHandler       customerrors.ErrorHandler
	uuid             mocks.MockGenerator
}

func MockUseCase(ctrl *gomock.Controller) (*auth.UseCase, *testDeps) {
	rtRepo := mocks.NewMockRefreshTokenRepository(ctrl)
	etRepo := mocks.NewMockEmailTokenRepository(ctrl)
	userRepo := mocks.NewMockUserRepository(ctrl)
	txManager := mocks.NewMockTxManager(ctrl)
	notificationRepo := mocks.NewMockNotificationRepository(ctrl)
	tokenSvc := mocks.NewMockTokenService(ctrl)
	passwordSvc := mocks.NewMockPasswordService(ctrl)
	errHandler := customerrors.NewErrHander()
	uuid := mocks.NewMockGenerator(ctrl)

	uc := auth.New(errHandler, txManager, userRepo, rtRepo, etRepo, notificationRepo, passwordSvc, tokenSvc, uuid)
	deps := &testDeps{
		rtRepo:           *rtRepo,
		etRepo:           *etRepo,
		userRepo:         *userRepo,
		txManager:        *txManager,
		notificationRepo: *notificationRepo,
		tokenSvc:         *tokenSvc,
		passwordSvc:      *passwordSvc,
		errHandler:       errHandler,
		uuid:             *uuid,
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

func mockHashPwd(s mocks.MockPasswordService, failed bool) {
	if failed {
		s.EXPECT().HashPassword(gomock.Any()).Return("", fmt.Errorf("hash failed"))
	} else {
		s.EXPECT().HashPassword(gomock.Any()).Return("hashedPassword", nil)
	}

}
