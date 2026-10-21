package access_test

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"

	"testing"

	"go.uber.org/mock/gomock"
)

func TestLogoutService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx context.Context
		rt  string
	}
	ctx := context.Background()
	a := args{
		ctx: ctx,
		rt:  "rt",
	}

	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.LogoutService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success logout
		{
			name: "success logout",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				return module.Logout
			},
			wantErr: false,
		},
		// received RT is invalid
		{
			name: "received RT is invalid",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return("", "", domain.ErrWrongRefreshToken())
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenWrong,
		},
		// received RT is expired
		{
			name: "received RT is expired",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return("", "", domain.ErrRefreshTokenExpired())

				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenExpired,
		},
		// stored RT is not found
		{
			name: "stored RT is not found",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenNotFound,
		},
		// failed to get stored RT
		{
			name: "failed to get stored RT",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// stored RT is already used
		{
			name: "stored RT is already used",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, true), nil)
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenAlreadyUsed,
		},
		// stored RT is expired
		{
			name: "stored RT is expired",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(true, false), nil)
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenExpired,
		},
		// failed to revoke stored RT
		{
			name: "failed to revoke stored RT",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LogoutService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.Logout
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.rt)
			if tt.wantErr {
				var e *domain.DomainError
				if err == nil {
					t.Errorf("expected error but got nil")
					return
				}
				if !errors.As(err, &e) {
					t.Errorf("expected domain error, got %T", err)
					return
				}
				if e.Code != tt.wantErrCode {
					t.Errorf("unexpected error Code: got %s, want %s", e.Code, tt.wantErrCode)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
			}
		})
	}
}
