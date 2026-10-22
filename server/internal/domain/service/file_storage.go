package service

import (
	"context"
	"io"
	"time"

	"task-trail/internal/domain/entity"
)

// StoredFile — a file in storage and when it was written.
type StoredFile struct {
	ID         entity.FileID
	ModifiedAt time.Time
}

// FileStorage stores file contents under a name equal to the file ID (ADR-0013). The file path
// is built only from the ID, not from user data.
type FileStorage interface {
	// Save writes a file. If it is not written completely, the partial file is deleted.
	Save(ctx context.Context, id entity.FileID, content io.Reader) error
	// Open opens a file for reading and returns its size.
	Open(ctx context.Context, id entity.FileID) (io.ReadCloser, int64, error)
	// Delete erases a file; a file that is already gone is not an error.
	Delete(ctx context.Context, id entity.FileID) error
	// List — all files in storage: cleanup looks among them for files without a database record.
	List(ctx context.Context) ([]StoredFile, error)
}
