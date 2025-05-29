package auth

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
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
	oldRT := entity.RefreshToken{
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
	newAT := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	newRT := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		want        *token.Token
		want1       *token.Token
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "Test success refresh",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			want:    newAT,
			want1:   newRT,
		},
		{
			name: "invalid refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token not found",
		},
		{
			name: "refresh token loading failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "refresh token loading failed",
		},
		{
			name: "refresh token is expired",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: time.Now()}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is expired",
		},
		{
			name: "refresh token is revoked, all user tokens was revoked",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.rtRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(1, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.UnauthorizedErr,
			wantErrMsg:  "refresh token is revoked, all user tokens was revoked",
		},
		{
			name: "revoke all users refresh tokens failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)

				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().
					GetByID(
						ctx, gomock.Any(), gomock.Any()).
					Return(&entity.RefreshToken{ID: oldRT.ID, UserID: oldRT.UserID, ExpiredAt: oldRT.ExpiredAt, RevokedAt: &oldRT.ExpiredAt}, nil)
				deps.rtRepo.EXPECT().RevokeAllUsersTokens(ctx, gomock.Any()).Return(0, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "revoke all users refresh tokens failed",
		},
		{
			name: "generation access token failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("at generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation access token failed",
		},
		{
			name: "generation refresh token failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.tokenSvc.EXPECT().VerifyRefreshToken(gomock.Any()).Return(oldRT.UserID, oldRT.ID, nil)
				deps.rtRepo.EXPECT().GetByID(ctx, gomock.Any(), gomock.Any()).Return(&oldRT, nil)
				mockTx(ctx, deps.txManager)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(newAT, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("rt generation failed"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "generation refresh token failed",
		},
		{
			name: "refresh token already exists",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			name: "revoke refresh token failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
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
			wantErrMsg:  "revoke refresh token failed",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			got, got1, err := u.Refresh(tt.args.ctx, tt.args.oldRT)
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
				t.Errorf("at got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("rt got = %v, want %v", got1, tt.want1)
			}
		})
	}
}
