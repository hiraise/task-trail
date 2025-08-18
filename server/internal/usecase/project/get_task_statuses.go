package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetTaskStatuses(ctx context.Context, projectID int, userID int) ([]*dto.ProjectStatus, error) {
	if err := u.CheckMembership(ctx, projectID, userID); err != nil {
		return nil, err
	}
	items, err := u.projectRepo.GetTaskStatuses(ctx, projectID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get task statuses by project ID",
			"projectID", projectID,
			"userID", userID,
		)
	}
	return items, nil
}
