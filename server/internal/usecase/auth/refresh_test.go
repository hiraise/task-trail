package auth_test

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/auth"
	"task-trail/internal/usecase/dto"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCaseRefresh(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	type args struct {
		ctx   context.Context
		oldRT string
	}
	oldRT := dto.RefreshToken{
		ID:        "123",
		UserID:    1,
		ExpiredAt: time.Now().Add(100 * time.Minute),
		RevokedAt: nil,
	}
	ctx := context.Background()
	a := args{
		ctx:   ctx,
		oldRT: "123",
	}
	newAT := &dto.AccessTokenRes{
		Token: "123",
		Exp:   time.Now(),
	}
	newRT := &dto.RefreshTokenRes{
		Token: "123",
		ID:    "123",
		Exp:   time.Now(),
	}
	w := &dto.RefreshRes{
		AT: newAT,
		RT: newRT,
	}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *auth.UseCase
		args        args
		want        *dto.RefreshRes
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success refresh",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.rtRepo.EXPECT().Revoke(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
			want:    w,
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
		{
			name: "failed to generate access token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("at generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to generate access token",
		},
		{
			name: "failed to generate refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("failed to generate refresh token"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to generate refresh token",
		},
		{
			name: "refresh token already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "refresh token already exists",
		},
		{
			name: "failed to create new refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new refresh token",
		},
		{
			name: "refresh token not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.rtRepo.EXPECT().Revoke(ctx, gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "failed to revoke refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(newRT, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				deps.rtRepo.EXPECT().Revoke(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to revoke refresh token",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			got, err := u.Refresh(tt.args.ctx, tt.args.oldRT)
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
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got = %v, want %v", got, tt.want)
			}
		})
	}
}
