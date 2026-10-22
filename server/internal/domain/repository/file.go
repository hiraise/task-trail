package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// FileRepository stores file records (ADR-0013). File lifecycle: uploaded → not needed
// (soft_deleted_at, the file is no longer served) → erased from disk by cleanup (deleted_at).
type FileRepository interface {
	Create(ctx context.Context, file *entity.File) error
	// Get finds a file that is still needed: one marked deleted is not found.
	Get(ctx context.Context, id entity.FileID) (*entity.File, error)
	// SoftDelete marks that the file is no longer needed, e.g. a replaced avatar.
	SoftDelete(ctx context.Context, id entity.FileID, now time.Time) error
	// ListSoftDeleted — unneeded files not yet erased from disk.
	ListSoftDeleted(ctx context.Context) ([]entity.FileID, error)
	// MarkErased marks that the file is erased from disk.
	MarkErased(ctx context.Context, id entity.FileID, now time.Time) error
	// Known returns those of ids that have a record and whose file is not erased yet: files on disk
	// without such a record are leftovers of an interrupted upload.
	Known(ctx context.Context, ids []entity.FileID) (map[entity.FileID]bool, error)
}
