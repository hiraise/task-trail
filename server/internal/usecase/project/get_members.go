package project

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetMembers(ctx context.Context, projectID int, userID int) ([]*dto.UserSimple, error) {
	if err := u.CheckMembership(ctx, projectID, userID); err != nil {
		return nil, err
	}
	return nil, nil

}
