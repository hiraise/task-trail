package factory

import (
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

// NotificationFactory makes notifications. now is an argument, not the clock: a notification has
// the time of the change it is about (ADR-0038).
type NotificationFactory struct {
	idGenerator service.IDGenerator
}

func NewNotificationFactory(idGenerator service.IDGenerator) *NotificationFactory {
	return &NotificationFactory{idGenerator: idGenerator}
}

func (f *NotificationFactory) New(
	userID entity.UserID,
	taskID entity.TaskID,
	actorID *entity.UserID,
	kind entity.NotificationKind,
	now time.Time,
) *entity.Notification {
	return &entity.Notification{
		ID:        entity.NotificationID(f.idGenerator.Generate()),
		UserID:    userID,
		TaskID:    taskID,
		ActorID:   actorID,
		Kind:      kind,
		CreatedAt: now,
	}
}
