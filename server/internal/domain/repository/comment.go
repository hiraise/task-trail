package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// CommentRepository — task comments (ADR-0028). Comments change under the lock of their task's
// project (ProjectRepository.GetForUpdate), like the task itself.
type CommentRepository interface {
	Create(ctx context.Context, comment *entity.Comment) error
	Get(ctx context.Context, id entity.CommentID) (*entity.Comment, error)
	// ListByTask — the task's comments, newest first; rows with the same time — in reverse write order.
	ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.Comment, error)
	// Update writes the text and the edit time.
	Update(ctx context.Context, comment *entity.Comment) error
	// Delete erases the comment at once.
	Delete(ctx context.Context, id entity.CommentID) error
}
