package auth_test

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/auth"
	"testing"

	"go.uber.org/mock/gomock"
)

func TestUseCaseAutoRegister(t *testing.T) {

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	ctx := context.Background()

	type args struct {
		ctx   context.Context
		email string
	}

	a := args{
		ctx:   ctx,
		email: testEmail,
	}

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
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.notificationRepo.EXPECT().SendAutoRegisterEmail(gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "email already taken",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(0, repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "email already taken",
		},
		{
			name: "failed to create new user",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(0, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new user",
		},
		{
			name: "failed to send registration email",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.notificationRepo.EXPECT().SendAutoRegisterEmail(gomock.Any(), testEmail).Return(fmt.Errorf("failed send notification"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to send registration email",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.AutoRegister(tt.args.ctx, tt.args.email)
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
