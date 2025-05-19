package auth

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
	"task-trail/test/mocks"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

const testPwd = "password"
const testEmail = "test@test.test"

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

func TestUseCase_Register(t *testing.T) {
	mockHashPwd := func(s mocks.MockPasswordService, failed bool) {
		if failed {
			s.EXPECT().HashPassword(gomock.Any()).Return("", fmt.Errorf("hash failed"))
		} else {
			s.EXPECT().HashPassword(gomock.Any()).Return("hashedPassword", nil)
		}

	}
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		email    string
		password string
	}

	ctx := context.Background()
	a := args{ctx: ctx,
		email:    testEmail,
		password: testPwd}

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
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		email    string
		password string
	}
	ctx := context.Background()
	a := args{
		ctx:      ctx,
		email:    testEmail,
		password: testPwd,
	}
	getTestUser := func(verified bool) *entity.User {

		user := &entity.User{ID: 1, Email: testEmail, PasswordHash: testPwd}
		if verified {
			t := time.Now()
			user.VerifiedAt = &t
		}
		return user
	}

	at := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	rt := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		want        int
		want1       *token.Token
		want2       *token.Token
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success login",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
			want:    1,
			want1:   at,
			want2:   rt,
		},
		{
			name: "Test user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "Test user loading failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(nil, repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "user loading failed",
		},
		{
			name: "Test user is unverified",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(false), nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user is unverified",
		},
		{
			name: "Test password is invalid",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(fmt.Errorf("invalid pwd"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user password is invalid",
		},
		{
			name: "Test access token generation failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("Token generation failed"))

				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation access token failed",
		},
		{
			name: "Test refresh token generation failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("Token generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation refresh token failed",
		},
		{
			name: "Test refresh token already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "refresh token already exists",
		},
		{
			name: "Test refresh token generation failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetUserByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new refresh token",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			got, got1, got2, err := u.Login(tt.args.ctx, tt.args.email, tt.args.password)
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
			if got != tt.want {
				t.Errorf("userId got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("at got = %v, want %v", got1, tt.want1)
			}
			if !reflect.DeepEqual(got2, tt.want2) {
				t.Errorf("rt got = %v, want %v", got2, tt.want2)
			}
		})
	}
}

func TestUseCase_Refresh(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	type args struct {
		ctx   context.Context
		oldRT string
	}
	oldRT := entity.Token{
		ID:        "123",
		UserId:    1,
		ExpiredAt: time.Now().Add(100 * time.Minute),
		RevokedAt: nil,
	}
	ctx := context.Background()
	a := args{
		ctx:   ctx,
		oldRT: "123",
	}
	newAT := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	newRT := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		want        *token.Token
		want1       *token.Token
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success refresh",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.tokenRepo.EXPECT().RevokeToken(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
			want:    newAT,
			want1:   newRT,
		},
		{
			name: "Test token is invalid",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(0, "", fmt.Errorf("invalid token"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "invalid refresh token",
		},
		{
			name: "Test old token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "Test old token loading failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "refresh token loading failed",
		},
		{
			name: "Test old token expired",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: time.Now()}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is expired",
		},
		{
			name: "Test refresh token already revoked",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.tokenRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(1, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is revoked, all user tokens was revoked",
		},
		{
			name: "Test revoke all refresh failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.tokenRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(0, repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "revoke all users refresh tokens failed",
		},
		{
			name: "Test access token generation failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("at generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation access token failed",
		},
		{
			name: "Test refresh token generation failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("rt generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation refresh token failed",
		},
		{
			name: "Test new rt already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "refresh token already exists",
		},
		{
			name: "Test persist rt failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new refresh token",
		},
		{
			name: "Test old token not found for revoke",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.tokenRepo.EXPECT().RevokeToken(ctx, gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "Test old token revoke failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.tokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.tokenRepo.EXPECT().RevokeToken(ctx, gomock.Any()).Return(repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "revoke refresh token failed",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			got, got1, err := u.Refresh(tt.args.ctx, tt.args.oldRT)
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
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("at got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("rt got = %v, want %v", got1, tt.want1)
			}
		})
	}
}

func TestUseCase_Logout(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	type args struct {
		ctx context.Context
		rt  string
	}
	oldRT := entity.Token{
		ID:        "123",
		UserId:    1,
		ExpiredAt: time.Now().Add(100 * time.Minute),
		RevokedAt: nil,
	}
	ctx := context.Background()
	a := args{
		ctx: ctx,
		rt:  "123",
	}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success refresh",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				deps.tokenRepo.EXPECT().RevokeToken(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "Test token is invalid",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(0, "", fmt.Errorf("invalid token"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "invalid refresh token",
		},
		{
			name: "Test old token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "Test old token loading failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().GetTokenById(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "refresh token loading failed",
		},
		{
			name: "Test old token expired",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: time.Now()}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is expired",
		},
		{
			name: "Test refresh token already revoked",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.tokenRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(1, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is revoked, all user tokens was revoked",
		},
		{
			name: "Test revoke all refresh failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserId, oldRT.ID, nil)
				deps.tokenRepo.EXPECT().
					GetTokenById(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.Token{ID: oldRT.ID, UserId: oldRT.UserId, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.tokenRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(0, repo.ErrDB)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "revoke all users refresh tokens failed",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.Logout(tt.args.ctx, tt.args.rt)
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
