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

func TestUseCaseLogout(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	type args struct {
		ctx context.Context
		rt  string
	}
	oldRT := dto.RefreshToken{
		ID:        "123",
		UserID:    1,
		ExpiredAt: time.Now().Add(100 * time.Minute),
		RevokedAt: nil,
	}
	ctx := context.Background()
	a := args{
		ctx: ctx,
		rt:  "123",
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
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				deps.rtRepo.EXPECT().Revoke(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "invalid refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(0, "", fmt.Errorf("invalid token"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "invalid refresh token",
		},
		{
			name: "refresh token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "failed to get refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get refresh token",
		},
		{
			name: "refresh token is expired",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&dto.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: time.Now()}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is expired",
		},
		{
			name: "refresh token is revoked, all user tokens was revoked",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&dto.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.rtRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(1, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is revoked, all user tokens was revoked",
		},
		{
			name: "failed to revoke all users refresh tokens",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&dto.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.rtRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(0, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to revoke all users refresh tokens",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			err := u.Logout(tt.args.ctx, tt.args.rt)
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
