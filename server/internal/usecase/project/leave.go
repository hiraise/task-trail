package project

import (
	"context"
)

func (u *UseCase) Leave(ctx context.Context, projectID int, memberID int) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.CheckMembership(ctx, projectID, memberID); err != nil {
			return err
		}
		if err := u.VerifyAccess(ctx, projectID, memberID, PROJECT_OWNER); err == nil {
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
