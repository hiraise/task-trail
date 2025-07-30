package project

import "context"

func (u *UseCase) Delete(ctx context.Context, projectID int, memberID int) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.VerifyAccess(ctx, projectID, memberID, PROJECT_DELETE); err != nil {
			return err
		}
		
		if err := u.projectRepo.Delete(ctx, projectID); err != nil {
			return u.errHandler.InternalTrouble(
				err, "failed to delete project",
				"projectID", projectID,
				"memberID", memberID,
			)
		}
		return nil
	})
}
