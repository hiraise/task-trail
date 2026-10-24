package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// Notification — a notification with its task and the person who acted; Actor is nil for reminders
// (ADR-0038).
type Notification struct {
	View  *repository.NotificationView
	Actor *entity.UserAccount
}
