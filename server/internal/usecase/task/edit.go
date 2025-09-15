package task

import (
	"context"
	"task-trail/internal/usecase"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Edit(ctx context.Context, userID int, taskID int, data *dto.TaskEdit) error {
	f := func(ctx context.Context) error {
		item, err := u.GetByID(ctx, userID, taskID)
		if err != nil {
			return err
		}
		if err := u.projectUC.VerifyAccess(ctx, item.ProjectID, userID, usecase.PROJECT_UPDATE_TASK); err != nil {
			return err
		}
		if err := u.taskRepo.UpdateByID(ctx, taskID, &dto.TaskUpdate{Name: data.Name, Description: data.Description}); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to update task")
		}
		return nil
	}
	return u.txManager.DoWithTx(ctx, f)

}
