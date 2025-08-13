package project

import (
	"context"
	"slices"
)

func (u *UseCase) KickMember(ctx context.Context, projectID int, requesterID int, memberID int) error {
	return u.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		if err := u.CheckMembership(ctx, projectID, requesterID); err != nil {
			return err
		}
		if err := u.CheckMembership(ctx, projectID, memberID); err != nil {
			return err
		}
		requesterPerms, err := u.projectRepo.GetMemberRights(ctx, projectID, requesterID)
		if err != nil {
			return u.errHandler.InternalTrouble(
				err, "cant load requester permissions",
				"projectID", projectID,
				"requesterID", requesterID,
				"memberID", memberID,
			)
		}

		if !slices.Contains(requesterPerms, PROJECT_KICK_USERS) {
			return u.errHandler.Forbidden(
				err, "user dont have required permission",
				"projectID", projectID,
				"requesterID", requesterID,
				"memberID", memberID,
			)
		}
		memberPerms, err := u.projectRepo.GetMemberRights(ctx, projectID, memberID)
		if err != nil {
			return u.errHandler.InternalTrouble(
				err, "cant load requester",
				"projectID", projectID,
				"requesterID", requesterID,
				"memberID", memberID,
			)
		}
		if slices.Contains(memberPerms, PROJECT_OWNER) {
			return u.errHandler.Forbidden(
				err, "cant kick owner",
				"projectID", projectID,
				"requesterID", requesterID,
				"memberID", memberID,
			)
		}
		if slices.Contains(memberPerms, PROJECT_ADMIN) && !slices.Contains(requesterPerms, PROJECT_OWNER) {
			return u.errHandler.Forbidden(
				err, "only owner can kick admin user",
				"projectID", projectID,
				"requesterID", requesterID,
				"memberID", memberID,
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
