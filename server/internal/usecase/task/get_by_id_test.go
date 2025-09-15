package task_test

import (
	"context"
	"errors"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/usecase/task"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCase_GetByID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx    context.Context
		userID int
		taskID int
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx, userID: 1, taskID: 1}
	retVal := &dto.TaskListRes{ID: 3, Name: "testname", CreatedAt: time.Now(), UpdatedAt: time.Now(), AuthorID: 1}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *task.UseCase
		args        args
		want        *dto.TaskListRes
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(retVal, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			want:    retVal,
			wantErr: false,
		},
		{
			name: "task not found",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(nil, repo.ErrNotFound)
				return uc
			},

			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "task not found",
		},
		{
			name: "failed to get task by ID",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},

			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get task by ID",
		},
		{
			name: "user cant access to task",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(retVal, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(deps.errHandler.NotFound(nil, "user cant access to task"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "user cant access to task",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			got, err := u.GetByID(tt.args.ctx, tt.args.userID, tt.args.taskID)
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
