package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// LabelRepository — labels of projects (ADR-0035) and their links to tasks.
type LabelRepository interface {
	// Create and Update return LABEL_NAME_TAKEN when the name is taken in the project ignoring case.
	Create(ctx context.Context, l *entity.Label) error
	Update(ctx context.Context, l *entity.Label) error
	// Get — the label of the project; another project's label is ENTITY_NOT_FOUND.
	Get(ctx context.Context, projectID entity.ProjectID, id entity.LabelID) (*entity.Label, error)
	// ListInProject — ordered by name ignoring case, then ID.
	ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Label, error)
	// ListByIDs — those of ids that are labels of the project, in any order.
	ListByIDs(ctx context.Context, projectID entity.ProjectID, ids []entity.LabelID) ([]*entity.Label, error)
	// Delete erases the label and its links to tasks.
	Delete(ctx context.Context, id entity.LabelID) error
	// ReplaceForTask makes ids the task's labels; ClearTask removes them all.
	ReplaceForTask(ctx context.Context, taskID entity.TaskID, ids []entity.LabelID) error
	ClearTask(ctx context.Context, taskID entity.TaskID) error
}
