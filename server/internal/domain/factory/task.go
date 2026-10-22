package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type TaskFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewTaskFactory(idGenerator service.IDGenerator, clock service.Clock) *TaskFactory {
	return &TaskFactory{idGenerator: idGenerator, clock: clock}
}

// New — задача, которую создаёт участник проекта author; assignee — участие исполнителя
// в проекте или nil.
func (f *TaskFactory) New(author *entity.ProjectMember, name string, description *string, assignee *entity.ProjectMember) (*entity.Task, error) {
	return entity.NewTask(entity.TaskID(f.idGenerator.Generate()), author.ProjectID, author.UserID, name, description, assignee, f.clock.Now())
}
