package project

import (
	"context"
	"errors"
	"slices"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) AddMembers(ctx context.Context, data *dto.ProjectAddMembers) error {
	project, err := u.GetOwned(ctx, data.ProjectID, data.OwnerID)
	if err != nil {
		return err
	}

	if err := u.verifyNewMembers(project.Members, data.MemberEmails); err != nil {
		return err
	}

	newEmails, err := u.getUnregisteredEmails(ctx, data.MemberEmails)
	if err != nil {
		return u.errHandler.InternalTrouble(err, "failed to get project members", "projectID", data.ProjectID)
	}

	f := func(ctx context.Context) error {
		if len(newEmails) > 0 {
			if err := u.registerNewUsers(ctx, newEmails); err != nil {
				return err
			}
		}

		memberIDs, err := u.getNewMembersIds(ctx, data.MemberEmails)
		if err != nil {
			return err
		}

		if err := u.projectRepo.AddMembers(ctx, &dto.ProjectAddMembersDB{ProjectID: data.ProjectID, MemberIDs: memberIDs}); err != nil {
			return u.errHandler.InternalTrouble(
				err,
				"failed to add new members to the project",
				"projectID", data.ProjectID,
				"ownerID", data.OwnerID,
				"membersIDs", memberIDs,
			)
		}
		if err := u.notificationRepo.SendInvintationInProject(ctx, &dto.NotificationProjectInvite{ProjectID: project.ID, ProjectName: project.Name, Recipients: data.MemberEmails}); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to send project invitation", "projectID", project.ID)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}

func (u *UseCase) GetOwned(ctx context.Context, projectID int, ownerID int) (*dto.Project, error) {
	project, err := u.projectRepo.GetOwned(ctx, projectID, ownerID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.NotFound(err, "project not found", "projectID", projectID, "ownerID", ownerID)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get project", "projectID", projectID, "ownerID", ownerID)
	}
	return project, nil
}

func (u *UseCase) verifyNewMembers(pMembers []*dto.UserEmailAndID, newMembers []string) error {
	for _, v := range pMembers {
		if slices.Contains(newMembers, v.Email) {
			return u.errHandler.BadRequest(nil, "member already in project", "memberEmail", v.Email)
		}
	}
	return nil
}

func (u *UseCase) getUnregisteredEmails(ctx context.Context, newMembers []string) ([]string, error) {
	f, err := u.userRepo.GetIdsByEmails(ctx, newMembers)
	if err != nil {
		return nil, err
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
	return newUsers, nil
}

func (u *UseCase) registerNewUsers(ctx context.Context, newMembers []string) error {
	for _, email := range newMembers {
		if err := u.authUC.AutoRegister(ctx, email); err != nil {
			return err
		}
	}
	return nil
}

func (u *UseCase) getNewMembersIds(ctx context.Context, newMembers []string) ([]int, error) {
	users, err := u.userRepo.GetIdsByEmails(ctx, newMembers)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get new members")
	}
	if len(users) != len(newMembers) {
		return nil, u.errHandler.InternalTrouble(err, "mismatch between found user IDs and new members count")
	}
	ids := make([]int, len(users))
	for i, user := range users {
		ids[i] = user.ID
	}
	return ids, nil
}
