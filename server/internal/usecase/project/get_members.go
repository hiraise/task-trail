package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetMembers(ctx context.Context, projectID int, userID int) ([]*dto.ProjectMember, error) {
	if err := u.CheckMembership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	members, err := u.projectRepo.GetMembers(ctx, projectID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get project members")
	}

	return members, nil

}
