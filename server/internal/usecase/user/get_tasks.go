package user

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) GetTasks(ctx context.Context, userID int) ([]*dto.TaskListRes, error) {
	items, err := u.userRepo.GetTasks(ctx, userID)
	if err != nil {
		return nil, u.errHandler.InternalTrouble(err, "failed to get tasks by userID ID",
			"userID", userID,
		)
	}
	return items, nil
}
