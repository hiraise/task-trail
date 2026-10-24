package response

import (
	"time"

	"task-trail/internal/application/dto"
)

// NotificationTask — the task a notification is about, with its current key and name.
type NotificationTask struct {
	ID   string `json:"id"`
	Key  string `json:"key"`
	Name string `json:"name"`
}

// Notification — Notification in the contract (ADR-0038): fields a kind does not use are null.
type Notification struct {
	ID           string           `json:"id"`
	Kind         string           `json:"kind"`
	Task         NotificationTask `json:"task"`
	Actor        *User            `json:"actor"`
	CreatedAt    time.Time        `json:"createdAt"`
	ReadAt       *time.Time       `json:"readAt"`
	FromStatusID *string          `json:"fromStatusId"`
	ToStatusID   *string          `json:"toStatusId"`
	Text         *string          `json:"text"`
	DueDate      *string          `json:"dueDate"`
}

func NewNotification(d dto.Notification) Notification {
	n := d.View.Notification
	out := Notification{
		ID:        string(n.ID),
		Kind:      string(n.Kind),
		Task:      NotificationTask{ID: string(n.TaskID), Key: d.View.TaskKey, Name: d.View.TaskName},
		CreatedAt: n.CreatedAt.UTC(),
		Text:      n.Text,
		DueDate:   n.DueDate,
	}
	if d.Actor != nil {
		actor := NewUser(d.Actor)
		out.Actor = &actor
	}
	if n.ReadAt != nil {
		readAt := n.ReadAt.UTC()
		out.ReadAt = &readAt
	}
	if n.FromStatus != nil {
		from := string(*n.FromStatus)
		out.FromStatusID = &from
	}
	if n.ToStatus != nil {
		to := string(*n.ToStatus)
		out.ToStatusID = &to
	}
	return out
}

func NewNotifications(notifications []dto.Notification) []Notification {
	out := make([]Notification, len(notifications))
	for i, n := range notifications {
		out[i] = NewNotification(n)
	}
	return out
}

// UnreadNotifications — UnreadNotifications in the contract.
type UnreadNotifications struct {
	Count int `json:"count"`
}
