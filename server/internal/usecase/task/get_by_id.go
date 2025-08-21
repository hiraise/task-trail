package task

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetByID(ctx context.Context, userID int, taskID int) (*dto.TaskListRes, error) {
	item, err := u.taskRepo.GetByID(ctx, taskID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.NotFound(err, "task not found",
				"taskID", taskID,
				"userID", userID,
			)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get task by ID",
			"userID", userID,
			"taskID", taskID,
		)
	}
	if err := u.projectUC.CheckMembership(ctx, item.ProjectID, userID); err != nil {
		return nil, err
	}
	return item, nil
}
