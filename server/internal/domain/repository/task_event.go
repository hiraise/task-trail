package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// TaskEventRepository — task history (ADR-0028): rows are only added, never edited or deleted.
type TaskEventRepository interface {
	Create(ctx context.Context, event *entity.TaskEvent) error
	// ListByTask — the task's events, newest first; rows with the same time — in reverse write order.
	ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.TaskEvent, error)
}
