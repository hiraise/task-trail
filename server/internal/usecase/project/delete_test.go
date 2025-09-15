package project_test

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/project"
	"testing"

	"go.uber.org/mock/gomock"
)

func TestUseCase_Delete(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx       context.Context
		projectID int
		userID    int
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx, projectID: 1, userID: 1}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *project.UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteRolesByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteTasksByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteStatusesByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},

			wantErr: false,
		},
		{
			name: "user dont have required permission",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "user dont have required permission",
		},
		{
			name: "failed to verify user accesst",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(false, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to verify user access",
		},
		{
			name: "failed to delete project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to delete project",
		},
		{
			name: "failed to delete project roles",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteRolesByProjectID(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to delete project roles",
		},
		{
			name: "failed to delete project tasks",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteRolesByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteTasksByProjectID(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to delete project tasks",
		},
		{
			name: "failed to delete project statuses",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteRolesByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteTasksByProjectID(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().DeleteStatusesByProjectID(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to delete project statuses",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			err := u.Delete(tt.args.ctx, tt.args.projectID, tt.args.userID)
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
