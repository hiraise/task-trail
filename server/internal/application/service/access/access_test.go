package access_test

import (
	"context"
	"fmt"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/test/mocks"
	"time"

	"go.uber.org/mock/gomock"
)

const TEST_USER_ID = "0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c"
const TEST_PASSWORD = "password"
const TEST_PASSWORD_HASH = "$2a$12$BformSW810v/6JNmJJchqO4tnE4gsqgvx/U2oEwI9TW541zRfZR4m"
const TEST_EMAIL = "test@test.test"
const RT_LIFETIME = time.Duration(10 * time.Minute)

type testDeps struct {
	txManager             mocks.MockTxManager
	userRepo              mocks.MockUserRepository
	refreshTokenRepo      mocks.MockRefreshTokenRepository
	confirmationTokenRepo mocks.MockConfirmationTokenRepository
	notifier              mocks.MockAccessNotifier
	passwordService       mocks.MockPasswordService
	accessTokenService    mocks.MockAccessTokenService
	idGenerator           mocks.MockIDGenerator
}

func MockUseCase(ctrl *gomock.Controller) (*access.AccessModule, *testDeps) {
	refreshTokenRepo := mocks.NewMockRefreshTokenRepository(ctrl)
	confirmationTokenRepo := mocks.NewMockConfirmationTokenRepository(ctrl)
	userRepo := mocks.NewMockUserRepository(ctrl)
	txManager := mocks.NewMockTxManager(ctrl)
	notifier := mocks.NewMockAccessNotifier(ctrl)
	accessTokenService := mocks.NewMockAccessTokenService(ctrl)
	passwordService := mocks.NewMockPasswordService(ctrl)
	idGenerator := mocks.NewMockIDGenerator(ctrl)

	userFactory := factory.NewUserFactory(idGenerator)
	confirmationTokenFactory := factory.NewCTFactory(idGenerator, RT_LIFETIME)
	refreshTokenFactory := factory.NewRTFactory(idGenerator, RT_LIFETIME)
	module := access.New(
		txManager,
		userRepo,
		userFactory,
		passwordService,
		confirmationTokenFactory,
		confirmationTokenRepo,
		notifier,
		refreshTokenFactory,
		refreshTokenRepo,
		accessTokenService)

	deps := &testDeps{
		txManager:             *txManager,
		userRepo:              *userRepo,
		refreshTokenRepo:      *refreshTokenRepo,
		confirmationTokenRepo: *confirmationTokenRepo,
		notifier:              *notifier,
		passwordService:       *passwordService,
		accessTokenService:    *accessTokenService,
		idGenerator:           *idGenerator,
	}
	return module, deps
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

func getTestUser(verified bool, withPassword bool) *entity.UserAccount {
	var hash *string
	if withPassword {
		h := TEST_PASSWORD_HASH
		hash = &h
	}
	user := &entity.UserAccount{ID: entity.UserID(TEST_USER_ID), Email: entity.Email(TEST_EMAIL), PasswordHash: hash}
	if verified {
		t := time.Now()
		user.VerifiedAt = &t
	}
	return user
}
