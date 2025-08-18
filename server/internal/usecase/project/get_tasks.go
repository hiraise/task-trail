package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetTasks(ctx context.Context, projectID int, userID int) ([]*dto.TaskListRes, error) {
	if err := u.CheckMembership(ctx, projectID, userID); err != nil {
		return nil, err
	}
	items, err := u.projectRepo.GetTasks(ctx, projectID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get tasks by project ID",
			"projectID", projectID,
			"userID", userID,
		)
	}
	return items, nil
}
