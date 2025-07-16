package project

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Create(ctx context.Context, data *dto.ProjectCreate) (int, error) {
	var id int
	var err error
	f := func(ctx context.Context) error {
		id, err = u.projectRepo.Create(ctx, data)
		if err != nil {
			if errors.Is(err, repo.ErrNotFound) {
				return u.errHandler.NotFound(err, "owner not found", "ownerID", data.OwnerID)
			}
			return u.errHandler.InternalTrouble(err, "failed to create project", "ownerID", data.OwnerID)
		}
		return nil
	}
	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return 0, err
	}
	return id, nil
}
