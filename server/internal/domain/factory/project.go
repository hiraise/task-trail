package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type ProjectFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewProjectFactory(idGenerator service.IDGenerator, clock service.Clock) *ProjectFactory {
	return &ProjectFactory{idGenerator: idGenerator, clock: clock}
}

// New создаёт проект и участие его создателя — владельца.
func (f *ProjectFactory) New(name string, description *string, ownerID entity.UserID) (*entity.Project, *entity.ProjectMember) {
	now := f.clock.Now()
	project := &entity.Project{
		ID:          entity.ProjectID(f.idGenerator.Generate()),
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	owner := &entity.ProjectMember{ProjectID: project.ID, UserID: ownerID, Role: entity.RoleOwner, CreatedAt: now, UpdatedAt: now}
	return project, owner
}
