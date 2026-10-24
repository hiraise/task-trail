package repository

import (
	"context"
	"time"

	"task-trail/internal/domain/entity"
)

// NotificationView — a notification with the current key and name of its task.
type NotificationView struct {
	Notification *entity.Notification
	TaskKey      string
	TaskName     string
}

// NotificationRepository — notifications (ADR-0038). Lists, counts and Get see only notifications of
// tasks that are not deleted, in projects where the user is still a member.
type NotificationRepository interface {
	Create(ctx context.Context, notifications ...*entity.Notification) error
	// ListForUser — the newest limit notifications, newest first.
	ListForUser(ctx context.Context, userID entity.UserID, limit int) ([]*NotificationView, error)
	CountUnread(ctx context.Context, userID entity.UserID) (int, error)
	// Get — the user's notification; another user's is ENTITY_NOT_FOUND.
	Get(ctx context.Context, userID entity.UserID, id entity.NotificationID) (*NotificationView, error)
	SetReadAt(ctx context.Context, id entity.NotificationID, readAt *time.Time) error
	MarkAllRead(ctx context.Context, userID entity.UserID, now time.Time) error
	// DeleteOlderThan erases notifications created before the moment; returns how many.
	DeleteOlderThan(ctx context.Context, before time.Time) (int64, error)
}
