package project_test

import (
	"context"
	"errors"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/usecase/project"
	"testing"

	"go.uber.org/mock/gomock"
)

func TestUseCase_Create(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data *dto.ProjectCreate
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx, data: &dto.ProjectCreate{
			Name:        "TestProject",
			Description: "Test",
			OwnerID:     1,
		}}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *project.UseCase
		args        args
		want        int
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(1, nil)
				deps.projectRepo.EXPECT().CreateRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AppendPermissions(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			want:    1,
			wantErr: false,
		},
		{
			name: "owner not found",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(0, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "owner not found",
		},
		{
			name: "failed to create project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(0, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create project",
		},
		{
			name: "failed to append permissions to role",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(1, nil)
				deps.projectRepo.EXPECT().CreateRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AppendPermissions(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to append permissions to role",
		},
		{
			name: "failed to find role in list",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(1, nil)
				deps.projectRepo.EXPECT().CreateRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return([]*dto.ProjectRoleRes{}, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to find role in list",
		},
		{
			name: "failed to add owner to project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(1, nil)
				deps.projectRepo.EXPECT().CreateRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AppendPermissions(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to add owner to project",
		},
		{
			name: "failed to create default default project roles",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().Create(gomock.Any(), gomock.Any(), gomock.Any()).Return(1, nil)
				deps.projectRepo.EXPECT().CreateRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to create default default project roles",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			got, err := u.Create(tt.args.ctx, tt.args.data)
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
