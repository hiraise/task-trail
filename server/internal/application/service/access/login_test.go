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

func TestLoginService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data dto.Credentials
	}
	ctx := context.Background()
	data := dto.Credentials{
		Email:    TEST_EMAIL,
		Password: TEST_PASSWORD,
	}
	a := args{
		ctx:  ctx,
		data: data,
	}

	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.LoginService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success loign
		{
			name: "succes login",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				deps.idGenerator.EXPECT().Generate().Return("tokenID")
				deps.refreshTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.accessTokenService.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(dto.AccessToken{}, dto.RefreshToken{}, nil)
				return module.Login
			},
			wantErr: false,
			want:    dto.SuccessLogin{UserID: TEST_USER_ID, AccessToken: dto.AccessToken{}, RefreshToken: dto.RefreshToken{}},
		},
		// wrong email
		{
			name: "wrong email",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(2, nil))
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.WrongEmail,
		},
		// failed to get user
		{
			name: "failed to get user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(2, nil))
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// user password not set
		{
			name: "user password not set",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, false), nil)
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.PasswordNotSet,
		},
		// user unverified
		{
			name: "user unverified",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, true), nil)
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.UserUnverified,
		},
		// failed to compare password
		{
			name: "failed to compare password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, domain.ErrPasswordCompareFailed(nil))
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.PasswordComapareFailed,
		},
		// wrong password
		{
			name: "wrong password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.WrongPassword,
		},
		// failed to save rt
		{
			name: "failed to save rt",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				deps.idGenerator.EXPECT().Generate().Return("tokenID")
				deps.refreshTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(domain.ErrRepoInternal(2, nil))
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		{
			name: "failed to create tokens dto",
			args: a,
			service: func(ctrl *gomock.Controller) *access.LoginService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				deps.idGenerator.EXPECT().Generate().Return("tokenID")
				deps.refreshTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.accessTokenService.EXPECT().GenerateTokensPair(gomock.Any(), gomock.Any()).Return(dto.AccessToken{}, dto.RefreshToken{}, domain.ErrTokenGenerateFailed(nil))
				return module.Login
			},
			wantErr:     true,
			wantErrCode: domain.TokenGenerationFailed,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			got, err := service.Execute(tt.args.ctx, tt.args.data)
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
