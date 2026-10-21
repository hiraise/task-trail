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

// New создаёт запись о файле. ID — случайный UUIDv4: по нему аватарку отдают без входа (ADR-0013).
// originalName — имя из запроса, от него остаётся только имя без пути.
func (f *FileFactory) New(originalName string, mimeType string, ownerID entity.UserID) *entity.File {
	return &entity.File{
		ID:           entity.FileID(f.idGenerator.Generate()),
		OriginalName: entity.CleanFileName(originalName),
		MimeType:     mimeType,
		OwnerID:      ownerID,
		CreatedAt:    f.clock.Now(),
	}
}
