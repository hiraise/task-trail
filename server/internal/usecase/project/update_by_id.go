package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) UpdateByID(ctx context.Context, projectID int, userID int, data *dto.ProjectUpdate) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.VerifyAccess(ctx, projectID, userID, PROJECT_EDIT); err != nil {
			return err
		}
		if err := u.projectRepo.Update(ctx, projectID, data); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to update project", "projectID", projectID, "ownerID", userID)
		}
		return nil
	})

}
