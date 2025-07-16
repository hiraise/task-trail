package auth_test

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/auth"
	"task-trail/internal/usecase/dto"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCaseSendPasswordResetEmail(t *testing.T) {

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx   context.Context
		email string
	}

	ctx := context.Background()
	a := args{ctx: ctx,
		email: testEmail}
	now := time.Now()
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *auth.UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail, VerifiedAt: &now}, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.notificationRepo.EXPECT().SendResetPasswordEmail(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.Ok,
			wantErrMsg:  "user not found",
		},
		{
			name: "failed to get user",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get user",
		},
		{
			name: "failed to get user",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get user",
		},
		{
			name: "user is not verified",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "user is not verified",
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail, VerifiedAt: &now}, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "failed to create email token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail, VerifiedAt: &now}, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create email token",
		},
		{
			name: "uuid generation conflict, email token already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail, VerifiedAt: &now}, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "uuid generation conflict, email token already exists",
		},
		{
			name: "failed to send reset password email",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().GetByEmail(gomock.Any(), gomock.Any()).Return(&dto.User{ID: 1, Email: testEmail, VerifiedAt: &now}, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.notificationRepo.EXPECT().SendResetPasswordEmail(gomock.Any(), testEmail, gomock.Any()).Return(fmt.Errorf("failed send notification"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to send reset password email",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.SendPasswordResetEmail(tt.args.ctx, tt.args.email)
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
