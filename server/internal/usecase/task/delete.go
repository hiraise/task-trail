package task

import (
	"context"
	"task-trail/internal/usecase"
)

func (u *UseCase) Delete(ctx context.Context, userID int, taskID int) error {
	item, err := u.GetByID(ctx, userID, taskID)
	if err != nil {
		return err
	}
	if err := u.projectUC.VerifyAccess(ctx, item.ProjectID, userID, usecase.PROJECT_DELETE_TASK); err != nil {
		return err
	}

	if err := u.taskRepo.Delete(ctx, taskID); err != nil {
		return u.errHandler.InternalTrouble(
			err, "failed to delete task",
			"taskID", taskID,
			"initiatorID", userID,
		)
	}
	return nil
}
