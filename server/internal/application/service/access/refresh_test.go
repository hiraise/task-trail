package access_test

import (
	"context"
	"errors"
	"reflect"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"

	"testing"

	"go.uber.org/mock/gomock"
)

func TestRefreshService(t *testing.T) {
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
		service     func(ctrl *gomock.Controller) *access.RefreshService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success refresh
		{
			name: "succes refresh",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.accessTokenService.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(dto.AccessToken{}, dto.RefreshToken{}, nil)
				deps.refreshTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				return module.Refresh
			},
			wantErr: false,
			want:    dto.SuccessLogin{UserID: TEST_USER_ID, AccessToken: dto.AccessToken{}, RefreshToken: dto.RefreshToken{}},
		},
		// received is RT invalid
		{
			name: "received is RT invalid",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return("", "", domain.ErrWrongRefreshToken())
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenWrong,
		},
		// received RT is expired
		{
			name: "received RT is expired",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return("", "", domain.ErrRefreshTokenExpired())
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenExpired,
		},
		// received RT not found
		{
			name: "received RT not found",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenNotFound,
		},
		// failed to get stored RT
		{
			name: "failed to get stored RT",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// stored RT is used
		{
			name: "stored RT is used",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, true), nil)
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenAlreadyUsed,
		},
		// stored RT is expired
		{
			name: "stored RT is expired",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(true, false), nil)
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RefreshTokenExpired,
		},
		// failed to create new RT
		{
			name: "failed to create new RT",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to generate new pair
		{
			name: "failed to generate new pair",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.accessTokenService.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(dto.AccessToken{}, dto.RefreshToken{}, domain.ErrTokenGenerateFailed(nil))
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.TokenGenerationFailed,
		},
		// failed to revoke stored RT
		{
			name: "failed to revoke stored RT",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RefreshService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.accessTokenService.EXPECT().VerifyRefreshToken(gomock.Any()).Return(TEST_USER_ID, "jti", nil)
				deps.refreshTokenRepo.EXPECT().GetUserToken(gomock.Any(), gomock.Any(), gomock.Any()).Return(getTestRefreshToken(false, false), nil)
				deps.refreshTokenRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.accessTokenService.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(dto.AccessToken{}, dto.RefreshToken{}, nil)
				deps.refreshTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.Refresh
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			got, err := service.Execute(tt.args.ctx, tt.args.rt)
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
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got = %v, want %v", got, tt.want)
			}
		})
	}
}
