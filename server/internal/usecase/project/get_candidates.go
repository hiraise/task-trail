package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetCandidates(ctx context.Context, ownerID int, projectID int) ([]*dto.UserSimple, error) {
	// if project id is passed, verify users membership
	if projectID != 0 {
		if err := u.CheckMembership(ctx, projectID, ownerID); err != nil {
			return nil, err
		}
	}
	res, err := u.projectRepo.GetCandidates(ctx, ownerID, projectID)
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
