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

func TestUseCaseLogin(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data *dto.Credentials
	}
	ctx := context.Background()
	data := &dto.Credentials{
		Email:    testEmail,
		Password: testPwd,
	}
	a := args{
		ctx:  ctx,
		data: data,
	}
	getTestUser := func(verified bool) *dto.User {

		user := &dto.User{ID: 1, Email: testEmail, PasswordHash: testPwd}
		if verified {
			t := time.Now()
			user.VerifiedAt = &t
		}
		return user
	}

	at := &dto.AccessTokenRes{
		Token: "123",
		Exp:   time.Now(),
	}
	rt := &dto.RefreshTokenRes{
		Token: "123",
		ID:    "123",
		Exp:   time.Now(),
	}
	w := &dto.LoginRes{
		UserID: 1,
		AT:     at,
		RT:     rt,
	}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller) *auth.UseCase
		args        args
		want        *dto.LoginRes
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(rt, nil)
				deps.rtRepo.EXPECT().Create(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
			want:    w,
		},
		{
			name: "user not found",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user not found",
		},
		{
			name: "failed to get user",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get user",
		},
		{
			name: "user is unverified",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
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
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(fmt.Errorf("invalid pwd"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InvalidCredentialsErr,
			wantErrMsg:  "user password is invalid",
		},
		{
			name: "failed to generate access token",
			args: a,
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(nil, fmt.Errorf("Token generation failed"))

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
				deps.userRepo.EXPECT().GetByEmail(ctx, gomock.Any()).Return(getTestUser(true), nil)
				deps.passwordSvc.EXPECT().ComparePassword(gomock.Any(), gomock.Any()).Return(nil)
				deps.tokenSvc.EXPECT().GenAccessToken(gomock.Any()).Return(at, nil)
				deps.tokenSvc.EXPECT().GenRefreshToken(gomock.Any()).Return(nil, fmt.Errorf("failed to generate token"))
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
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
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
			uc: func(ctrl *gomock.Controller) *auth.UseCase {
				uc, deps := MockUseCase(ctrl)
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
			got, err := u.Login(tt.args.ctx, tt.args.data)
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
