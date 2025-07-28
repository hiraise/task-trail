package project

import (
	"context"
	"slices"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) AddMembers(ctx context.Context, data *dto.ProjectAddMembers) error {
	if err := u.VerifyAccess(ctx, data.ProjectID, data.OwnerID, PROJECT_INVITE_USERS); err != nil {
		return err
	}
	members, err := u.projectRepo.GetMembers(ctx, data.ProjectID)
	if err != nil {
		return u.errHandler.InternalTrouble(err, "failed to get project members")
	}

	if err := u.validateMembersAreNew(members, data.MemberEmails); err != nil {
		return err
	}

	candidates, newEmails, err := u.getUnregisteredEmails(ctx, data.MemberEmails)
	if err != nil {
		return u.errHandler.InternalTrouble(err, "failed to get new members by email")
	}

	f := func(ctx context.Context) error {
		if len(newEmails) > 0 {
			items, err := u.registerNewUsers(ctx, newEmails)
			if err != nil {
				return err
			}
			candidates = append(candidates, items...)
		}

		roles, err := u.projectRepo.GetProjectRoles(ctx, data.ProjectID)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to get project roles", "projectID", data.ProjectID)
		}

		role, err := u.findRolesInList(roles, MemberRoleName)
		if err != nil {
			return err
		}

		var items []*dto.ProjectAddMembersDB
		for _, m := range candidates {
			items = append(items, &dto.ProjectAddMembersDB{MemberID: m.ID, RoleID: role.ID, ProjectID: data.ProjectID})
		}

		if err := u.projectRepo.AddMembers(ctx, items); err != nil {
			return u.errHandler.InternalTrouble(
				err,
				"failed to add new members to the project",
				"projectID", data.ProjectID,
				"ownerID", data.OwnerID,
				"newMembers", data.MemberEmails,
			)
		}
		pr, err := u.projectRepo.GetByID(ctx, data.ProjectID)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to get project", "projectID", data.ProjectID)
		}
		if err := u.notificationRepo.SendInvintationInProject(ctx, &dto.NotificationProjectInvite{ProjectID: pr.ID, ProjectName: pr.Name, Recipients: data.MemberEmails}); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to send project invitation", "projectID", pr.ID)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}

func (u *UseCase) validateMembersAreNew(pMembers []*dto.ProjectMember, newMembers []string) error {
	for _, v := range pMembers {
		if slices.Contains(newMembers, v.Email) {
			return u.errHandler.BadRequest(nil, "member already in project", "memberEmail", v.Email)
		}
	}
	return nil
}

func (u *UseCase) getUnregisteredEmails(ctx context.Context, newMembers []string) ([]*dto.UserEmailAndID, []string, error) {
	f, err := u.userRepo.GetIdsByEmails(ctx, newMembers)
	if err != nil {
		return nil, nil, err
	}
	var foundEmails = make(map[string]struct{}, len(f))
	for _, v := range f {
		foundEmails[v.Email] = struct{}{}
	}
	var newUsers []string
	for _, email := range newMembers {
		if _, ok := foundEmails[email]; !ok {
			newUsers = append(newUsers, email)
		}
	}
	return f, newUsers, nil
}

func (u *UseCase) registerNewUsers(ctx context.Context, newMembers []string) ([]*dto.UserEmailAndID, error) {
	var items []*dto.UserEmailAndID
	for _, email := range newMembers {
		id, err := u.authUC.AutoRegister(ctx, email)
		if err != nil {
			return nil, err
		}
		items = append(items, &dto.UserEmailAndID{ID: id, Email: email})
	}
	return items, nil
}
