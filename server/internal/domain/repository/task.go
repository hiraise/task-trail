package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// TaskRepository — tasks. A deleted task (ADR-0001) is not found by any method.
// Tasks change only under their project's lock (ProjectRepository.GetForUpdate):
// this way changes to one task do not overwrite each other, and the assignee stays
// in line with the project members.
type TaskRepository interface {
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id entity.TaskID) (*entity.Task, error)
	// ListInProject — the project's tasks, newest first.
	ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Task, error)
	// ListAssigned — tasks where userID is the assignee, in projects where they are a member; newest first.
	ListAssigned(ctx context.Context, userID entity.UserID) ([]*entity.Task, error)
	// Update writes everything task operations change: project, title, description,
	// status, assignee and update time.
	Update(ctx context.Context, task *entity.Task) error
	SoftDelete(ctx context.Context, id entity.TaskID, now time.Time) error
	// UnassignInProject removes the user from the project's tasks: a removed member or one
	// who left is no longer an assignee (contract, removeProjectMember and leaveProject).
	UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) error
}
