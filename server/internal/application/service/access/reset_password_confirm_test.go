package access_test

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"testing"

	"go.uber.org/mock/gomock"
)

func TestConfirmResetPasswordService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data dto.ResetPassword
	}
	ctx := context.Background()
	data := dto.ResetPassword{
		Token:    "token",
		Password: TEST_PASSWORD,
	}
	a := args{
		ctx:  ctx,
		data: data,
	}

	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success confirm
		{
			name: "succes confirm",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hashed", nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				return module.ConfirmResetPassword
			},
			wantErr: false,
		},
		// wrong token
		{
			name: "wrong token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenWrong,
		},
		// token expired
		{
			name: "token expired",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, true, false), nil)
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenExpired,
		},
		// token used
		{
			name: "token used",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, true), nil)
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenAlreadyUsed,
		},
		// failed to get token
		{
			name: "failed to get token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to get user
		{
			name: "failed to get user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// password is same as old one
		{
			name: "password is same as old one",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordSameAsOld,
		},
		// failed to change password
		{
			name: "failed to change password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("", domain.ErrPasswordHashingFailed(nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordHashingFailed,
		},
		// failed to update user
		{
			name: "failed to update user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hashed", nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to update token
		{
			name: "failed to update token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ConfirmResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.ResetPasswordConfirmation, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hashed", nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.ConfirmResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.data)
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
