package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type LabelFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewLabelFactory(idGenerator service.IDGenerator, clock service.Clock) *LabelFactory {
	return &LabelFactory{idGenerator: idGenerator, clock: clock}
}

// New creates a label of the project (ADR-0035).
func (f *LabelFactory) New(projectID entity.ProjectID, name string, color entity.LabelColor) *entity.Label {
	return entity.NewLabel(entity.LabelID(f.idGenerator.Generate()), projectID, name, color, f.clock.Now())
}
