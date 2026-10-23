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

// New — task number number of project projectKey from draft, created by project member
// author; assignee — the assignee's membership in the project or nil.
func (f *TaskFactory) New(author *entity.ProjectMember, projectKey entity.ProjectKey, number int, draft entity.TaskDraft, assignee *entity.ProjectMember) (*entity.Task, error) {
	return entity.NewTask(entity.TaskID(f.idGenerator.Generate()), author.ProjectID, projectKey, number, author.UserID, draft, assignee, f.clock.Now())
}
