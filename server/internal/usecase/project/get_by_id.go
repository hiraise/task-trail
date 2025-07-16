package project

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetByID(ctx context.Context, projectID int, memberID int) (*dto.ProjectRes, error) {
	if err := u.CheckMembership(ctx, projectID, memberID); err != nil {
		return nil, err
	}
	item, err := u.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.NotFound(err, "project not found", "projectID", projectID, "memberID", memberID)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get project", "projectID", projectID, "memberID", memberID)
	}
	return item, nil
}
