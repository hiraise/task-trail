package project

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetList(ctx context.Context, data *dto.ProjectList) ([]*dto.ProjectRes, error) {
	retVal, err := u.projectRepo.GetList(ctx, data)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.NotFound(err, "member not found", "memberID", data.MemberID)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get projects list", "memberID", data.MemberID)
	}
	return retVal, nil
}
