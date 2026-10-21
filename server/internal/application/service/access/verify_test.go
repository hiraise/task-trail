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

func TestVerifyAccountService(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		tokendID string
	}
	ctx := context.Background()
	a := args{
		ctx:      ctx,
		tokendID: "token-id",
	}
	tests := []struct {
		name        string
		service     func(ctrl *gomock.Controller) *access.VerifyAccountService
		args        args
		want        dto.SuccessLogin
		wantErr     bool
		wantErrCode domain.ErrorCode
	}{
		// success verify account
		{
			name: "success verify account",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				return module.Verify
			},
			wantErr: false,
		},
		// wrong token
		{
			name: "wrong token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrEntityNotFound(0, nil))
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenWrong,
		},
		// expired token
		{
			name: "expired token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, true, false), nil)
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenExpired,
		},
		// used token
		{
			name: "used token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, true), nil)
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.ConfirmationTokenAlreadyUsed,
		},
		// failed to get token
		{
			name: "failed to get token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to get user
		{
			name: "failed to get user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, domain.ErrRepoInternal(0, nil))
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// user already verified
		{
			name: "user already verified",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(true, true), nil)
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.UserAlreadyVerified,
		},
		// failed to update user
		{
			name: "failed to update user",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
		// failed to update token
		{
			name: "failed to update token",
			args: a,
			service: func(ctrl *gomock.Controller) *access.VerifyAccountService {
				module, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.confirmationTokenRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestConfirmationToken(entity.AccountVerification, false, false), nil)
				deps.userRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(getTestUser(false, false), nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.confirmationTokenRepo.EXPECT().Update(ctx, gomock.Any()).Return(domain.ErrRepoInternal(0, nil))
				return module.Verify
			},
			wantErr:     true,
			wantErrCode: domain.RepoInternal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := tt.service(ctrl)
			err := service.Execute(tt.args.ctx, tt.args.tokendID)
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
