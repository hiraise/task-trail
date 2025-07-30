package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetCandidates(ctx context.Context, ownerID int, projectID int) ([]*dto.UserSimple, error) {
	// if project id is passed, verify users membership
	if projectID != 0 {
		// user must have access to invite users to get list of candidates
		if err := u.VerifyAccess(ctx, projectID, ownerID, PROJECT_INVITE_USERS); err != nil {
			return nil, err
		}
	}
	res, err := u.projectRepo.GetCandidates(ctx, ownerID, projectID, OwnerRoleName)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(
			err,
			"failed to get candidates",
			"ownerID", ownerID,
			"projectID", projectID,
		)
	}
	return res, nil
}
