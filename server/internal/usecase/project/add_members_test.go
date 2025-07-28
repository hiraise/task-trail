package project_test

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/usecase/project"
	"testing"

	"go.uber.org/mock/gomock"
)

var testRoles = []*dto.ProjectRoleRes{
	{ID: 1, Name: project.AdminRoleName},
	{ID: 2, Name: project.MemberRoleName},
	{ID: 3, Name: project.OwnerRoleName},
}

func TestUseCase_AddMembers(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx  context.Context
		data *dto.ProjectAddMembers
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx, data: &dto.ProjectAddMembers{
			ProjectID:    1,
			OwnerID:      1,
			MemberEmails: []string{"test1@mail.com", "test2@mail.com", "test3@mail.com", "test4@mail.com"},
		}}
	testProject := &dto.ProjectRes{
		ID:          1,
		Name:        "Test",
		Description: "Test",
		TaskCount:   0,
	}
	testMembers := []*dto.ProjectMember{
		{ID: 1, Email: "test@mail.com", Role: project.OwnerRoleName},
	}
	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *project.UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		// success
		{
			name: "success",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(ctx, gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(testProject, nil)
				deps.notificationRepo.EXPECT().SendInvintationInProject(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		// success, but users already registered
		{
			name: "success, but users already registered",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(ctx, gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return(
					[]*dto.UserEmailAndID{
						{ID: 2, Email: "test1@mail.com"},
						{ID: 3, Email: "test2@mail.com"},
					},
					nil,
				)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(testProject, nil)
				deps.notificationRepo.EXPECT().SendInvintationInProject(ctx, gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		// user dont has required permission
		{
			name: "user dont has required permission",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "user dont has required permission",
		},
		// failed to get project members
		{
			name: "failed to get project members",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get project members",
		},
		// member already in project
		{
			name: "member already in project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				// mockTx(args.ctx, deps.txManager)
				var mm []*dto.ProjectMember = make([]*dto.ProjectMember, len(testMembers))
				copy(mm, testMembers)
				mm = append(mm, &dto.ProjectMember{ID: 2, Email: "test1@mail.com"})
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(mm, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ValidationErr,
			wantErrMsg:  "member already in project",
		},
		// failed to get project members
		{
			name: "failed to get project members",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				// mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get new members by email",
		},
		// failed to register new users
		{
			name: "failed to register new users",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(0, deps.errHandler.InternalTrouble(nil, "failed to register new users"))
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to register new users",
		},
		// failed to get project roles
		{
			name: "failed to get project roles",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)

				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get project roles",
		},
		// failed to find role in list
		{
			name: "failed to find role in list",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return([]*dto.ProjectRoleRes{}, nil)

				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to find role in list",
		},
		// failed to add new members to the project
		{
			name: "failed to add new members to the project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to add new members to the project",
		},
		// failed to get project
		{
			name: "failed to get project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to get project",
		},
		// failed to send project invitation
		{
			name: "failed to send project invitation",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockUseCase(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().HasPermission(ctx, gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
				deps.projectRepo.EXPECT().GetMembers(gomock.Any(), gomock.Any()).Return(testMembers, nil)
				deps.userRepo.EXPECT().GetIdsByEmails(gomock.Any(), args.data.MemberEmails).Return([]*dto.UserEmailAndID{}, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(2, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(3, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(4, nil)
				deps.authUC.EXPECT().AutoRegister(gomock.Any(), gomock.Any()).Return(5, nil)
				deps.projectRepo.EXPECT().GetProjectRoles(gomock.Any(), gomock.Any()).Return(testRoles, nil)
				deps.projectRepo.EXPECT().AddMembers(gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().GetByID(gomock.Any(), gomock.Any()).Return(testProject, nil)
				deps.notificationRepo.EXPECT().SendInvintationInProject(ctx, gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to send project invitation",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			err := u.AddMembers(tt.args.ctx, tt.args.data)
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
