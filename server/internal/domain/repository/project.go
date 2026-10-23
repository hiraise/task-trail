package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// ProjectView — a project as a member sees it: with the task count and the member's role.
type ProjectView struct {
	Project *entity.Project
	// TasksCount — the project's tasks, except deleted ones and those archived on their own (ADR-0027).
	TasksCount int
	Role       entity.ProjectRole
}

// ProjectRepository — projects. A deleted project (ADR-0001) is not found by any method.
type ProjectRepository interface {
	Create(ctx context.Context, project *entity.Project) error
	// GetForUpdate locks the project row until the end of the transaction. Scenarios that change
	// a project, its members or tasks start with it: this way the role check and the action itself
	// do not diverge from a parallel change.
	GetForUpdate(ctx context.Context, id entity.ProjectID) (*entity.Project, error)
	// GetView — the project as seen by member userID; a non-member gets ENTITY_NOT_FOUND.
	GetView(ctx context.Context, id entity.ProjectID, userID entity.UserID) (*ProjectView, error)
	// ListViews — projects where userID is a member, newest first: archived ones if archived is true,
	// otherwise active ones (ADR-0027).
	ListViews(ctx context.Context, userID entity.UserID, archived bool) ([]*ProjectView, error)
	// Update writes the name, description, key, archive time and update time.
	// A key taken by another non-deleted project — PROJECT_KEY_TAKEN; Create answers the same.
	Update(ctx context.Context, project *entity.Project) error
	// NextTaskNumber hands out the project's next task number (ADR-0026). Called under the project
	// lock (GetForUpdate); a number is never handed out twice.
	NextTaskNumber(ctx context.Context, id entity.ProjectID) (int, error)
	// SoftDelete marks the project and its tasks as deleted; project membership stays (ADR-0001).
	SoftDelete(ctx context.Context, id entity.ProjectID, now time.Time) error
}
