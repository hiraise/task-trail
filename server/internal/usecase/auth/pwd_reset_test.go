package auth

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCaseResetPassword(t *testing.T) {

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		tokenID  string
		password string
	}

	ctx := context.Background()
	a := args{ctx: ctx,
		tokenID:  "123",
		password: "123",
	}

	validToken := entity.EmailToken{
		ID:        "123",
		ExpiredAt: time.Now().Add(time.Minute * 10),
		UserID:    1,
		Purpose:   entity.PurposeReset,
	}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.etRepo.EXPECT().Use(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "email token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)

				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.etRepo.EXPECT().Use(ctx, gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "email token not found",
		},
		{
			name: "email token update failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)

				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(nil)
				deps.etRepo.EXPECT().Use(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "email token update failed",
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				mockHashPwd(deps.passwordSvc, false)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)
				deps.userRepo.EXPECT().Update(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "user update failed",
		},
		{
			name: "email token is expired",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				expiredToken := validToken
				expiredToken.ExpiredAt = time.Now().Add(time.Second * -1)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&expiredToken, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "email token is expired",
		},
		{
			name: "email token already used",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				now := time.Now()
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				usedToken := validToken
				usedToken.UsedAt = &now
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&usedToken, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "email token already used",
		},
		{
			name: "email token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "email token not found",
		},
		{
			name: "failed to get email token",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get email token",
		},
		{
			name: "password hashing failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				mockTx(ctx, deps.txManager)
				deps.etRepo.EXPECT().GetByID(ctx, gomock.Any()).Return(&validToken, nil)
				mockHashPwd(deps.passwordSvc, true)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "password hashing failed",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.ResetPassword(tt.args.ctx, tt.args.tokenID, tt.args.password)
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
