package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type FileFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewFileFactory(idGenerator service.IDGenerator, clock service.Clock) *FileFactory {
	return &FileFactory{idGenerator: idGenerator, clock: clock}
}

// New creates a file record. ID is a random UUIDv4: avatars are served by it without sign-in (ADR-0013).
// originalName — the name from the request; only the base name without a path is kept.
func (f *FileFactory) New(originalName string, mimeType string, ownerID entity.UserID) *entity.File {
	return &entity.File{
		ID:           entity.FileID(f.idGenerator.Generate()),
		OriginalName: entity.CleanFileName(originalName),
		MimeType:     mimeType,
		OwnerID:      ownerID,
		CreatedAt:    f.clock.Now(),
	}
}
