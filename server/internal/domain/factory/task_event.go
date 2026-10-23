package factory

import (
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

// TaskEventFactory makes history rows. now is an argument, not the clock: the event gets exactly
// the time of the change it records (ADR-0028).
type TaskEventFactory struct {
	idGenerator service.IDGenerator
}

func NewTaskEventFactory(idGenerator service.IDGenerator) *TaskEventFactory {
	return &TaskEventFactory{idGenerator: idGenerator}
}

// New — an event of a kind without change fields: created, edited, archived, restored.
func (f *TaskEventFactory) New(taskID entity.TaskID, actorID entity.UserID, kind entity.TaskEventKind, now time.Time) *entity.TaskEvent {
	return &entity.TaskEvent{ID: entity.TaskEventID(f.idGenerator.Generate()), TaskID: taskID, ActorID: actorID, Kind: kind, CreatedAt: now}
}

func (f *TaskEventFactory) StatusChanged(taskID entity.TaskID, actorID entity.UserID, from, to entity.TaskStatus, now time.Time) *entity.TaskEvent {
	e := f.New(taskID, actorID, entity.EventStatusChanged, now)
	e.FromStatus, e.ToStatus = &from, &to
	return e
}

func (f *TaskEventFactory) PriorityChanged(taskID entity.TaskID, actorID entity.UserID, from, to entity.TaskPriority, now time.Time) *entity.TaskEvent {
	e := f.New(taskID, actorID, entity.EventPriorityChanged, now)
	e.FromPriority, e.ToPriority = &from, &to
	return e
}

// AssigneeChanged — from and to are assignees, nil — no assignee.
func (f *TaskEventFactory) AssigneeChanged(taskID entity.TaskID, actorID entity.UserID, from, to *entity.UserID, now time.Time) *entity.TaskEvent {
	e := f.New(taskID, actorID, entity.EventAssigneeChanged, now)
	e.FromUser, e.ToUser = from, to
	return e
}

// Moved — from and to are task keys before and after the move (ADR-0026).
func (f *TaskEventFactory) Moved(taskID entity.TaskID, actorID entity.UserID, from, to string, now time.Time) *entity.TaskEvent {
	e := f.New(taskID, actorID, entity.EventMoved, now)
	e.FromKey, e.ToKey = &from, &to
	return e
}
