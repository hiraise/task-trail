package task_test

import (
	"context"
	"errors"
	"reflect"
	"task-trail/internal/customerrors"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/usecase/task"
	"testing"

	"go.uber.org/mock/gomock"
)

func TestUseCase_Create(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data *dto.TaskCreate
	}
	ctx := context.Background()
	id := 1
	desc := "test"
	data := &dto.TaskCreate{
		ProjectID:   1,
		AssigneeID:  &id,
		StatusID:    &id,
		Name:        "test",
		Description: &desc,
	}
	testArgs :=
		args{ctx: ctx, data: data}
	retVal := 1
	taskStatuses := []*dto.ProjectStatus{
		{ID: 1, IsDefault: true, IsResolved: false, Name: "test"},
		{ID: 2, IsDefault: true, IsResolved: false, Name: "test"},
	}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *task.UseCase
		args        args
		want        int
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *task.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectUC.EXPECT().VerifyAccess(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.proejctRepo.EXPECT().GetTaskStatuses(gomock.Any(), gomock.Any()).Return(taskStatuses, nil)
				deps.projectUC.EXPECT().CheckMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.taskRepo.EXPECT().Create(gomock.Any(), gomock.Any()).Return(retVal, nil)

				return uc
			},
			want:    retVal,
			wantErr: false,
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
