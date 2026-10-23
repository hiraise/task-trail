package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type BoardFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewBoardFactory(idGenerator service.IDGenerator, clock service.Clock) *BoardFactory {
	return &BoardFactory{idGenerator: idGenerator, clock: clock}
}

// New creates a board; its creator is the owner (ADR-0029).
func (f *BoardFactory) New(name string, ownerID entity.UserID) *entity.Board {
	now := f.clock.Now()
	return &entity.Board{
		ID:        entity.BoardID(f.idGenerator.Generate()),
		Name:      name,
		OwnerID:   ownerID,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
