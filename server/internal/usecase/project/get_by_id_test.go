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
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCase_GetByID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx       context.Context
		projectID int
		memberID  int
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx, projectID: 1, memberID: 1}
	retVal := dto.ProjectRes{ID: 1, Name: "Test", Description: "Test", TaskCount: 0, CreatedAt: time.Now()}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *project.UseCase
		args        args
		want        *dto.ProjectRes
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().IsMember(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(&retVal, nil)
				return uc
			},
			want:    &retVal,
			wantErr: false,
		},
		{
			name: "user not a member of project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().IsMember(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "project not found",
		},
		{
			name: "failed to verify user membership",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().IsMember(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to verify user membership",
		},
		{
			name: "project not found`",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().IsMember(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "project not found",
		},
		{
			name: "failed to get project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().IsMember(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get project",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			got, err := u.GetByID(tt.args.ctx, tt.args.projectID, tt.args.memberID)
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
