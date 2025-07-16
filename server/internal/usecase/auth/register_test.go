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

	"go.uber.org/mock/gomock"
)

func TestUseCaseRegister(t *testing.T) {

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data *dto.Credentials
	}

	data := &dto.Credentials{
		Email:    testEmail,
		Password: testPwd,
	}
	ctx := context.Background()
	a := args{ctx: ctx,
		data: data}

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
				mockHashPwd(deps.passwordSvc, false)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.notificationRepo.EXPECT().SendVerificationEmail(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "failed to send verification email",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(nil)
				deps.notificationRepo.EXPECT().SendVerificationEmail(gomock.Any(), testEmail, gomock.Any()).Return(fmt.Errorf("failed send notification"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to send verification email",
		},
		{
			name: "uuid generation conflict, email token already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "uuid generation conflict, email token already exists",
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
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
				mockHashPwd(deps.passwordSvc, false)
				deps.uuid.EXPECT().Generate().Return(gomock.Any().String())
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(1, nil)
				deps.etRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create email token",
		},

		{
			name: "email already taken",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(0, repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "email already taken",
		},
		{
			name: "failed to hash password",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, true)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to hash password",
		},
		{
			name: "failed to create new user",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				// transaction mock
				mockTx(ctx, deps.txManager)
				// failed to hash password
				mockHashPwd(deps.passwordSvc, false)
				deps.userRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(0, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new user",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.Register(tt.args.ctx, tt.args.data)
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
