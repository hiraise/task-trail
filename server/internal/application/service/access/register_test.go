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

func TestRegistrationService(t *testing.T) {
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
		service     func(ctrl *gomock.Controller) *access.RegistrationService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success register
		{
			name: "succes refresh",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hash", nil)
				deps.userRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendAccountConfirmation(gomock.Any(), gomock.Any()).Return(nil)
				return module.Registration
			},
			wantErr: false,
		},
		// user already exists
		{
			name: "user already exists",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(true, nil)
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.EmailAlreadyExists,
		},
		// repo internal error
		{
			name: "repo internal error",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, domain.ErrRepoInternal(0, nil))
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to hash password
		{
			name: "failed to hash password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("", domain.ErrPasswordHashingFailed(nil))
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.PasswordHashingFailed,
		},
		// failed to create user
		{
			name: "failed to create user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hash", nil)
				deps.userRepo.EXPECT().Create(ctx, gomock.Any()).Return(domain.ErrRepoInternal(1, nil))
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to create confirmation token
		{
			name: "failed to create confirmation token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hash", nil)
				deps.userRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(domain.ErrRepoInternal(2, nil))
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to send notification
		{
			name: "failed to send notification",
			args: a,
			service: func(ctrl *gomock.Controller) *access.RegistrationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().ExistsByEmail(ctx, gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("hash", nil)
				deps.userRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendAccountConfirmation(gomock.Any(), gomock.Any()).Return(domain.ErrNotificationFailed(nil))
				return module.Registration
			},
			wantErr:     true,
			wantErrCode: domain.NotificationFailed,
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
