package project_test

import (
	"context"
	"errors"
	"task-trail/internal/customerrors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase"
	"task-trail/internal/usecase/project"
	"testing"

	"go.uber.org/mock/gomock"
)

func TestUseCase_KickMember(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	type args struct {
		ctx         context.Context
		projectID   int
		requesterID int
		memberID    int
	}
	ctx := context.Background()
	testArgs :=
		args{ctx: ctx,
			projectID:   1,
			requesterID: 1,
			memberID:    2,
		}
	adminRights := []string{usecase.PROJECT_KICK_USERS, usecase.PROJECT_ADMIN}
	ownerRights := []string{usecase.PROJECT_KICK_USERS, usecase.PROJECT_OWNER}
	userRights := []string{}

	tests := []struct {
		name        string
		uc          func(ctrl *gomock.Controller, args args) *project.UseCase
		args        args
		wantErr     bool
		wantErrType customerrors.ErrType
		wantErrMsg  string
	}{
		{
			name: "success, owner kick user",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {
				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(userRights, nil)
				deps.projectRepo.EXPECT().RemoveMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "success, owner kick admin",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(adminRights, nil)
				deps.projectRepo.EXPECT().RemoveMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "failed, owner kick owner",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "cant kick owner",
		},
		{
			name: "success, admin kick user",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(adminRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(userRights, nil)
				deps.projectRepo.EXPECT().RemoveMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				return uc
			},
			wantErr: false,
		},
		{
			name: "failed, admin kick admin",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(adminRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(adminRights, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "only owner can kick admin user",
		},
		{
			name: "failed, admin kick owner",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(adminRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "cant kick owner",
		},
		{
			name: "failed, without kick permission",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(userRights, nil)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.ForbiddenErr,
			wantErrMsg:  "user dont have required permission",
		},
		{
			name: "failed, requester not a member",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "project or user not found",
		},
		{
			name: "failed to verify requester membership",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to verify user membership",
		},
		{
			name: "failed, member not a member",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrNotFound)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.NotFoundErr,
			wantErrMsg:  "project or user not found",
		},
		{
			name: "failed to verify member membership",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to verify user membership",
		},
		{
			name: "failed to load requester permissions",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to load requester permissions",
		},
		{
			name: "failed to load member permissions",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to load member permissions",
		},
		{
			name: "failed to kick from project",
			args: testArgs,
			uc: func(ctrl *gomock.Controller, args args) *project.UseCase {

				uc, deps := mockDependencies(ctrl)
				mockTx(args.ctx, deps.txManager)
				deps.projectRepo.EXPECT().VerifyMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil).Times(2)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(ownerRights, nil)
				deps.projectRepo.EXPECT().GetMemberRights(gomock.Any(), gomock.Any(), gomock.Any()).Return(userRights, nil)
				deps.projectRepo.EXPECT().RemoveMembership(gomock.Any(), gomock.Any(), gomock.Any()).Return(repo.ErrInternal)
				return uc
			},
			wantErr:     true,
			wantErrType: customerrors.InternalErr,
			wantErrMsg:  "failed to kick from project",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := tt.uc(ctrl, tt.args)
			err := u.KickMember(tt.args.ctx, tt.args.projectID, tt.args.requesterID, tt.args.memberID)
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
