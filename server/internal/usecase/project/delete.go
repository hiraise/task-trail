package project

import (
	"context"
	"task-trail/internal/usecase"
)

func (u *UseCase) Delete(ctx context.Context, projectID int, memberID int) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.VerifyAccess(ctx, projectID, memberID, usecase.PROJECT_DELETE); err != nil {
			return err
		}
		if err := u.projectRepo.Delete(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}

		if err := u.projectRepo.DeleteRolesByProjectID(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project roles",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}

		if err := u.projectRepo.DeleteTasksByProjectID(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project tasks",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}

		if err := u.projectRepo.DeleteStatusesByProjectID(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project statuses",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}
		return nil
	})
}
