package auth

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/pkg/password"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
	"task-trail/test/mocks"
	"testing"

	"go.uber.org/mock/gomock"
)

type testDeps struct {
	userRepo    mocks.MockUserRepository
	tokenRepo   mocks.MockTokenRepository
	txManager   mocks.MockTxManager
	passwordSvc mocks.MockPasswordService
	tokenSvc    mocks.MockTokenService
	errHandler  customerrors.ErrorHandler
}

func mockUseCase(ctrl *gomock.Controller) (*UseCase, *testDeps) {
	mockTokenRepo := mocks.NewMockTokenRepository(ctrl)
	mockUserRepo := mocks.NewMockUserRepository(ctrl)
	mocktxManager := mocks.NewMockTxManager(ctrl)
	mockTokenSvc := mocks.NewMockTokenService(ctrl)
	mockPasswordSvc := mocks.NewMockPasswordService(ctrl)
	errHandler := customerrors.NewErrHander()

	uc := New(errHandler, mocktxManager, mockUserRepo, mockTokenRepo, mockPasswordSvc, mockTokenSvc)
	deps := &testDeps{
		tokenRepo:   *mockTokenRepo,
		userRepo:    *mockUserRepo,
		txManager:   *mocktxManager,
		tokenSvc:    *mockTokenSvc,
		passwordSvc: *mockPasswordSvc,
		errHandler:  errHandler,
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
		s.EXPECT().HashPassword(gomock.Any()).Return(gomock.Any().String(), nil)
	}

}
func TestUseCase_Register(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		email    string
		password string
	}

	const password = "password"
	const email = "test@test.test"
	ctx := context.Background()
	a := args{ctx: ctx,
		email:    email,
		password: password}

	// user := &entity.User{
	// 	Email:        email,
	// 	PasswordHash: password,
	// }
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success register",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "Test email already taken",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "email already taken",
		},
		{
			name: "Test hash password failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				// transaction mock
				mockTx(ctx, deps.txManager)
				// password hashing failed
				mockHashPwd(deps.passwordSvc, true)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "password hashing failed",
		},
		{
			name: "Test failed to save user in db",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				// transaction mock
				mockTx(ctx, deps.txManager)
				// password hashing failed
				mockHashPwd(deps.passwordSvc, false)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new user",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.Register(tt.args.ctx, tt.args.email, tt.args.password)
			if tt.wantErr {
				var e *customerrors.Err
				if err == nil {
					t.Errorf("expected error but got nil")
					return
				}
				if !errors.As(err, &e) {
					t.Errorf("expected custom error type, got %T", err)
					return
				}
				if e.Type != tt.wantErrType {
					t.Errorf("unexpected error type: got %d, want %d", e.Type, tt.wantErrType)
				}
				if e.Msg != tt.wantErrMsg {
					t.Errorf("unexpected error msg: got %s, want %s", e.Msg, tt.wantErrMsg)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}

func TestUseCase_Login(t *testing.T) {
	type fields struct {
		errHandler  customerrors.ErrorHandler
		txManager   repo.TxManager
		userRepo    repo.UserRepository
		tokenRepo   repo.TokenRepository
		passwordSvc password.Service
		tokenSvc    token.Service
	}
	type args struct {
		ctx      context.Context
		email    string
		password string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    int
		want1   *token.Token
		want2   *token.Token
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &UseCase{
				errHandler:  tt.fields.errHandler,
				txManager:   tt.fields.txManager,
				userRepo:    tt.fields.userRepo,
				tokenRepo:   tt.fields.tokenRepo,
				passwordSvc: tt.fields.passwordSvc,
				tokenSvc:    tt.fields.tokenSvc,
			}
			got, got1, got2, err := u.Login(tt.args.ctx, tt.args.email, tt.args.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("UseCase.Login() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("UseCase.Login() got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("UseCase.Login() got1 = %v, want %v", got1, tt.want1)
			}
			if !reflect.DeepEqual(got2, tt.want2) {
				t.Errorf("UseCase.Login() got2 = %v, want %v", got2, tt.want2)
			}
		})
	}
}

func TestUseCase_Refresh(t *testing.T) {
	type fields struct {
		errHandler  customerrors.ErrorHandler
		txManager   repo.TxManager
		userRepo    repo.UserRepository
		tokenRepo   repo.TokenRepository
		passwordSvc password.Service
		tokenSvc    token.Service
	}
	type args struct {
		ctx   context.Context
		oldRT string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		want    *token.Token
		want1   *token.Token
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &UseCase{
				errHandler:  tt.fields.errHandler,
				txManager:   tt.fields.txManager,
				userRepo:    tt.fields.userRepo,
				tokenRepo:   tt.fields.tokenRepo,
				passwordSvc: tt.fields.passwordSvc,
				tokenSvc:    tt.fields.tokenSvc,
			}
			got, got1, err := u.Refresh(tt.args.ctx, tt.args.oldRT)
			if (err != nil) != tt.wantErr {
				t.Errorf("UseCase.Refresh() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("UseCase.Refresh() got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("UseCase.Refresh() got1 = %v, want %v", got1, tt.want1)
			}
		})
	}
}

func TestUseCase_Logout(t *testing.T) {
	type fields struct {
		errHandler  customerrors.ErrorHandler
		txManager   repo.TxManager
		userRepo    repo.UserRepository
		tokenRepo   repo.TokenRepository
		passwordSvc password.Service
		tokenSvc    token.Service
	}
	type args struct {
		ctx context.Context
		rt  string
	}
	tests := []struct {
		name    string
		fields  fields
		args    args
		wantErr bool
	}{
		// TODO: Add test cases.
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &UseCase{
				errHandler:  tt.fields.errHandler,
				txManager:   tt.fields.txManager,
				userRepo:    tt.fields.userRepo,
				tokenRepo:   tt.fields.tokenRepo,
				passwordSvc: tt.fields.passwordSvc,
				tokenSvc:    tt.fields.tokenSvc,
			}
			if err := u.Logout(tt.args.ctx, tt.args.rt); (err != nil) != tt.wantErr {
				t.Errorf("UseCase.Logout() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
