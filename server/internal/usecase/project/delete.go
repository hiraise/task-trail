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
		roles, err := u.projectRepo.GetProjectRoles(ctx, projectID)
		if err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to get project roles",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}
		if err := u.projectRepo.Delete(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}
		ids := make([]int, 0, len(roles))
		for _, u := range roles {
			ids = append(ids, u.ID)
		}
		if err := u.projectRepo.DeleteRoles(ctx, ids); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project roles",
				"roleIDs", ids,
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}

		if err := u.projectRepo.DeleteTasks(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project tasks",
				"projectID", projectID,
				"initiatorID", memberID,
			)
		}
		return nil
	})
}
