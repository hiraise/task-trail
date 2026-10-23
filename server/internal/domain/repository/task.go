package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// TaskKeyQuery — a task key recognized in a search query (ADR-0030): an upper-case project key and a number.
type TaskKeyQuery struct {
	Key    entity.ProjectKey
	Number int
}

// TaskRepository — tasks. A deleted task (ADR-0001) is not found by any method.
// Every method that returns tasks fills Task.ProjectKey and Task.ProjectArchived from the task's project.
// Tasks change only under their project's lock (ProjectRepository.GetForUpdate):
// this way changes to one task do not overwrite each other, and the assignee stays
// in line with the project members.
type TaskRepository interface {
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id entity.TaskID) (*entity.Task, error)
	// ListInProject — the project's tasks, newest first: archived on their own if archived is true,
	// otherwise the rest (ADR-0027).
	ListInProject(ctx context.Context, projectID entity.ProjectID, archived bool) ([]*entity.Task, error)
	// ListAssigned — tasks where userID is the assignee, in projects where they are a member; newest first.
	// archived: the task or its project is archived; otherwise neither is (ADR-0027).
	ListAssigned(ctx context.Context, userID entity.UserID, archived bool) ([]*entity.Task, error)
	// Search — tasks of projects where viewerID is a member, archived ones included, whose name,
	// description or key (DS-12) matches the ILIKE pattern (ADR-0030). With key set, the task with exactly
	// that key comes first; the rest are recently updated first. At most limit.
	Search(ctx context.Context, viewerID entity.UserID, pattern string, key *TaskKeyQuery, limit int) ([]*entity.Task, error)
	// Update writes everything task operations change: project, number, title, description,
	// status, priority, due date, assignee, parent, archive time and update time.
	Update(ctx context.Context, task *entity.Task) error
	SoftDelete(ctx context.Context, id entity.TaskID, now time.Time) error
	// UnassignInProject removes the user from the project's tasks: a removed member or one
	// who left is no longer an assignee (contract, removeProjectMember and leaveProject).
	// Archived tasks are cleared too (ADR-0027). Returns the IDs of the changed tasks: each gets
	// an assignee_changed event (ADR-0028).
	UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) ([]entity.TaskID, error)
	// ListSubtasks — subtasks of the task, archived ones included, by number (ADR-0036).
	ListSubtasks(ctx context.Context, parentID entity.TaskID) ([]*entity.Task, error)
	// HasSubtasks — whether the task has non-deleted subtasks, archived ones included.
	HasSubtasks(ctx context.Context, id entity.TaskID) (bool, error)
	// DetachSubtasks clears the parent of the task's subtasks and returns their IDs: each gets a
	// parent_changed event (ADR-0036).
	DetachSubtasks(ctx context.Context, parentID entity.TaskID, now time.Time) ([]entity.TaskID, error)
}
