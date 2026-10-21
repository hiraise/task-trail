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

func TestResetPasswordService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx   context.Context
		email string
	}
	ctx := context.Background()
	a := args{
		ctx:   ctx,
		email: TEST_EMAIL,
	}
	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.ResetPasswordService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success reset password
		{
			name: "success reset password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendPasswordResetConfirmation(gomock.Any(), gomock.Any()).Return(nil)
				return module.ResetPassword
			},
			wantErr: false,
		},
		// wrong email
		{
			name: "wrong email",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.ResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.WrongEmail,
		},
		// failed to get user
		{
			name: "failed to get user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.ResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// unverified user
		{
			name: "unverified user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				return module.ResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.UserUnverified,
		},
		// failed to create confirmation token
		{
			name: "failed to create confirmation token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.ResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to send notification
		{
			name: "failed to send notification",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResetPasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendPasswordResetConfirmation(gomock.Any(), gomock.Any()).Return(domain.ErrNotificationFailed(nil))
				return module.ResetPassword
			},
			wantErr:     true,
			wantErrCode: domain.NotificationFailed,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.email)
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
