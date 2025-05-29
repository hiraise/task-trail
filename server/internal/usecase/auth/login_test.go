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

func TestUseCaseLogin(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx      context.Context
		email    string
		password string
	}
	ctx := context.Background()
	a := args{
		ctx:      ctx,
		email:    testEmail,
		password: testPwd,
	}
	getTestUser := func(verified bool) *entity.User {

		user := &entity.User{ID: 1, Email: testEmail, PasswordHash: testPwd}
		if verified {
			t := time.Now()
			user.VerifiedAt = &t
		}
		return user
	}

	at := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}
	rt := &token.Token{
		Token: "123",
		Jti:   "123",
		Exp:   time.Now(),
	}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *UseCase
		args        args
		want        int
		want1       *token.Token
		want2       *token.Token
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
			want:    1,
			want1:   at,
			want2:   rt,
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "user loading failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "user loading failed",
		},
		{
			name: "user is unverified",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(false), nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user is unverified",
		},
		{
			name: "user password is invalid",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(fmt.Errorf("invalid pwd"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user password is invalid",
		},
		{
			name: "generation access token failed",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("Token generation failed"))

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
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("Token generation failed"))
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
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrConflict)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ConflictErr,
			wantErrMsg:  "refresh token already exists",
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "failed to create new refresh token",
			args: a,
			uc: func(ctrl *gomock.Controller) *UseCase {
				uc, deps := mockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create new refresh token",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl)
			got, got1, got2, err := u.Login(tt.args.ctx, tt.args.email, tt.args.password)
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
			if got != tt.want {
				t.Errorf("userID got = %v, want %v", got, tt.want)
			}
			if !reflect.DeepEqual(got1, tt.want1) {
				t.Errorf("at got = %v, want %v", got1, tt.want1)
			}
			if !reflect.DeepEqual(got2, tt.want2) {
				t.Errorf("rt got = %v, want %v", got2, tt.want2)
			}
		})
	}
}
