package access_test

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/access"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"time"

	"testing"

	"go.uber.org/mock/gomock"
)

func TestResendVerificationService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx context.Context
		e   string
	}
	ctx := context.Background()
	a := args{
		ctx: ctx,
		e:   TEST_EMAIL,
	}
	old_notifications := []*entity.ConfirmationToken{
		{ID: "test-id", UserID: TEST_USER_ID, Purpose: entity.AccountVerification, ExpiredAt: time.Now(), UsedAt: nil},
	}
	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.ResendVerificationService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success resend verification
		{
			name: "success resend verification",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.confirmationTokenRepo.EXPECT().Find(ctx, gomock.Any()).Return(old_notifications, nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendAccountConfirmation(gomock.Any(), gomock.Any()).Return(nil)
				return module.ResendVerification
			},
			wantErr: false,
		},
		// wrong email
		{
			name: "wrong email",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.WrongEmail,
		},
		// user already verified
		{
			name: "user already verified",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.UserAlreadyVerified,
		},
		// failed to get user
		{
			name: "failed to get user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to update old tokens
		{
			name: "failed to update old tokens",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.confirmationTokenRepo.EXPECT().Find(ctx, gomock.Any()).Return(old_notifications, nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to create new token
		{
			name: "failed to create new token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.confirmationTokenRepo.EXPECT().Find(ctx, gomock.Any()).Return(old_notifications, nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to send notification
		{
			name: "failed to send notification",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.confirmationTokenRepo.EXPECT().Find(ctx, gomock.Any()).Return(old_notifications, nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.notifier.EXPECT().SendAccountConfirmation(gomock.Any(), gomock.Any()).Return(domain.ErrNotificationFailed(nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.NotificationFailed,
		},
		// failed to find old tokens
		{
			name: "failed to find old tokens",
			args: a,
			service: func(ctrl *gomock.Controller) *access.ResendVerificationService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.confirmationTokenRepo.EXPECT().Find(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.ResendVerification
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.e)
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
