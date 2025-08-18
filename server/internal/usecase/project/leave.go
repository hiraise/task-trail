package project

import (
	"context"
	"task-trail/internal/usecase"
)

func (u *UseCase) Leave(ctx context.Context, projectID int, memberID int) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.CheckMembership(ctx, projectID, memberID); err != nil {
			return err
		}
		res, err := u.projectRepo.HasPermission(ctx, projectID, memberID, usecase.PROJECT_OWNER)
		if err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to verify user access",
				"projectID", projectID,
				"userID", memberID,
				"permission", usecase.PROJECT_OWNER,
			)
		}
		if res {
			return u.errHandler.Forbidden(
				nil, "project owner cant leave project",
				"projectID", projectID,
				"userID", memberID,
			)
		}
		if err := u.projectRepo.RemoveMembership(ctx, projectID, memberID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to leave from project",
				"projectID", projectID,
				"userID", memberID,
			)
		}
		return nil
	})
}
