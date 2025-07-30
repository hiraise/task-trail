package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetByID(ctx context.Context, projectID int, memberID int) (*dto.ProjectRes, error) {
	if err := u.CheckMembership(ctx, projectID, memberID); err != nil {
		return nil, err
	}
	item, err := u.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get project", "projectID", projectID, "memberID", memberID)
	}
	rights, err := u.projectRepo.GetMemberRights(ctx, projectID, memberID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get member rights", "projectID", projectID, "memberID", memberID)
	}
	return &dto.ProjectRes{
		ID:          item.ID,
		TaskCount:   item.TaskCount,
		Name:        item.Name,
		Description: item.Description,
		CreatedAt:   item.CreatedAt,
		Rights:      rights,
	}, nil
}
