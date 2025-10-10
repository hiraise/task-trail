package task

import (
	"context"
	"task-trail/internal/usecase"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) ChangeAssignee(ctx context.Context, userID int, taskID int, assigneeID *int) error {
	item, err := u.GetByID(ctx, userID, taskID)
	if err != nil {
		return err
	}
	if err := u.projectUC.VerifyAccess(ctx, item.ProjectID, userID, usecase.PROJECT_UPDATE_TASK); err != nil {
		return err
	}
	if assigneeID != nil {
		err := u.projectUC.CheckMembership(ctx, item.ProjectID, *assigneeID)
		if err != nil {
			return err
		}
	}

	if err := u.taskRepo.UpdateByID(ctx, taskID, &dto.TaskUpdate{AssigneeID: &dto.OptInt{HasValue: true, Value: assigneeID}}); err != nil {
		return u.errHandler.InternalTrouble(err, "failed to change task status")
	}
	return nil
}
