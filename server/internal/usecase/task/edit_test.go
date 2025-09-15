package task_test

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/usecase/task"
	"testing"
	"time"

	"go.uber.org/mock/gomock"
)

func TestUseCase_Edit(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx    context.Context
		userID int
		taskID int
		data   *dto.TaskEdit
	}
	ctx := context.Background()
	desc := "test"
	data := &dto.TaskEdit{
		Name:        &desc,
		Description: &desc,
	}
	testArgs :=
		args{ctx: ctx, userID: 1, taskID: 1, data: data}
	retVal := &dto.TaskListRes{ID: 3, Name: "testname", CreatedAt: time.Now(), UpdatedAt: time.Now(), AuthorID: 1}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *task.UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{

		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				// get task uc
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(retVal, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				// verify access to edit task
				deps.projectUC.EXPECT().VerifyAccess(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				// Edit task
				deps.taskRepo.EXPECT().UpdateByID(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)

				return uc
			},
			wantErr: false,
		},
		{
			name: "action not permitted",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				// get task uc
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(retVal, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				// verify access to edit task
				deps.projectUC.EXPECT().VerifyAccess(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(deps.errHandler.Forbidden(nil, "access denied"))

				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "access denied",
		},
		{
			name: "failed to update task",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				// get task uc
				deps.taskRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(retVal, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				// verify access to edit task
				deps.projectUC.EXPECT().VerifyAccess(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				// Edit task
				deps.taskRepo.EXPECT().UpdateByID(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)

				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to update task",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			err := u.Edit(tt.args.ctx, tt.args.userID, tt.args.taskID, tt.args.data)
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
