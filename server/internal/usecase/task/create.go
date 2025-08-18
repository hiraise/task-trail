package task

import (
	"context"
	"slices"
	"task-trail/internal/usecase"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Create(ctx context.Context, data *dto.TaskCreate) (int, error) {
	var id int
	f := func(ctx context.Context) error {
		if err := u.projectUC.VerifyAccess(ctx, data.ProjectID, data.AuthorID, usecase.PROJECT_CREATE_TASK); err != nil {
			return err
		}
		statuses, err := u.projectRepo.GetTaskStatuses(ctx, data.ProjectID)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to load project task statuses")
		}
		if data.StatusID != nil {
			if !slices.ContainsFunc(statuses, func(v *dto.ProjectStatus) bool {
				return v.ID == *data.StatusID
			}) {
				return u.errHandler.BadRequest(err,
					"passed status does not belong to the project",
					"projectID", data.ProjectID,
					"statusID", data.StatusID,
				)
			}
		} else {
			index := slices.IndexFunc(statuses, func(v *dto.ProjectStatus) bool {
				return v.IsDefault
			})
			if index == -1 {
				return u.errHandler.InternalTrouble(err, "project statuses does not contains default", "projectID", data.ProjectID)
			}
			data.StatusID = &statuses[index].ID
		}
		if data.AssigneeID != nil {
			if err := u.projectUC.CheckMembership(ctx, data.ProjectID, *data.AssigneeID); err != nil {
				return u.errHandler.BadRequest(err,
					"passed assignee id is not a member of project",
					"projectID", data.ProjectID,
					"assigneID", data.AssigneeID,
				)
			}
		}
		id, err = u.taskRepo.Create(ctx, data)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to create task")
		}
		return nil
	}
	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return 0, err
	}
	return id, nil
}
