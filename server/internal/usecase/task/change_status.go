package task

import (
	"context"
	"task-trail/internal/usecase"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) ChangeStatus(ctx context.Context, userID int, taskID, statusID int) error {
	item, err := u.GetByID(ctx, userID, taskID)
	if err != nil {
		return err
	}
	if err := u.projectUC.VerifyAccess(ctx, item.ProjectID, userID, usecase.PROJECT_UPDATE_TASK); err != nil {
		return err
	}
	belong, err := u.projectRepo.IsStatusBelongProject(ctx, item.ProjectID, statusID)
	if err != nil {
		return u.errHandler.InternalTrouble(err, "failed to check status belonging to the project",
			"projectID", item.ProjectID,
			"userID", userID,
			"statusID", statusID,
		)
	}

	if !belong {
		return u.errHandler.BadRequest(err, "status does not belong to the project",
			"projectID", item.ProjectID,
			"userID", userID,
			"statusID", statusID,
		)
	}
	if err := u.taskRepo.UpdateByID(ctx, taskID, &dto.TaskUpdate{StatusID: &statusID}); err != nil {
		return u.errHandler.InternalTrouble(err, "failed to change task status")
	}
	return nil
}
