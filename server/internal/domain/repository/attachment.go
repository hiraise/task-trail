package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// AttachmentRepository — attachments of tasks (ADR-0037). Files marked deleted are not returned.
type AttachmentRepository interface {
	Create(ctx context.Context, a *entity.Attachment) error
	// ListByTask — newest first.
	ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.Attachment, error)
	// Get — the attachment of this task; another task's file is ENTITY_NOT_FOUND.
	Get(ctx context.Context, taskID entity.TaskID, fileID entity.FileID) (*entity.Attachment, error)
	Delete(ctx context.Context, fileID entity.FileID) error
	// TaskOf — the task of an attachment file; nil if the file is not an attachment (an avatar).
	TaskOf(ctx context.Context, fileID entity.FileID) (*entity.TaskID, error)
}
