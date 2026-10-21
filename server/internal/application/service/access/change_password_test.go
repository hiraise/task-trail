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

func TestChangePasswordService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx       context.Context
		userID    string
		passwords dto.ChangePassword
	}
	ctx := context.Background()
	passwords := dto.ChangePassword{
		OldPassword: "oldPassword",
		NewPassword: "newPassword",
	}
	a := args{
		ctx:       ctx,
		userID:    TEST_USER_ID,
		passwords: passwords,
	}

	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.ChangePasswordService
		args        args
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success change
		{
			name: "succes change",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				// New password is not equal with old
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return(TEST_PASSWORD_HASH, nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				return module.ChangePassword
			},
			wantErr: false,
		},
		// user not found
		{
			name: "user not found",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)

				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(2, nil))
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.EntityNotFound,
		},
		// wrong old password
		{
			name: "wrong old password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.WrongPassword,
		},
		// failed to compare old password
		{
			name: "failed to compare old password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, domain.ErrPasswordCompareFailed(nil))
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordComapareFailed,
		},
		// new password same as old
		{
			name: "new password same as old",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				// New password is not equal with old
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordSameAsOld,
		},
		// failed to compare new password
		{
			name: "failed to compare new password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				// New password is not equal with old
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, domain.ErrPasswordCompareFailed(nil))
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordComapareFailed,
		},
		// failed to hash new password
		{
			name: "failed to hash new password",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				// New password is not equal with old
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return("", domain.ErrPasswordHashingFailed(nil))
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.PasswordHashingFailed,
		},
		// failed to update user
		{
			name: "failed to update user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ChangePasswordService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				// Compare old password is correct
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(true, nil)
				// New password is not equal with old
				deps.passwordService.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(false, nil)
				deps.passwordService.EXPECT().HashPassword(gomock.Any()).Return(TEST_PASSWORD_HASH, nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(2, nil))
				return module.ChangePassword
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.userID, tt.args.passwords)
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
