package entity

import (
	"strings"
	"time"
	"unicode/utf8"
)

type NotificationID string

// NotificationKind — what a notification is about (ADR-0038). A new kind needs an ADR.
type NotificationKind string

const (
	NotifyAssigned      NotificationKind = "assigned"
	NotifyStatusChanged NotificationKind = "status_changed"
	NotifyCommented     NotificationKind = "commented"
	NotifyMentioned     NotificationKind = "mentioned"
	NotifyDueSoon       NotificationKind = "due_soon"
	NotifyOverdue       NotificationKind = "overdue"
)

// Notification — one user's notification about one task. Change fields are set only by the kinds
// that use them: status_changed — FromStatus/ToStatus; commented and mentioned — Text;
// due_soon and overdue — DueDate (YYYY-MM-DD). ActorID is nil for reminders.
type Notification struct {
	ID         NotificationID
	UserID     UserID
	TaskID     TaskID
	ActorID    *UserID
	Kind       NotificationKind
	FromStatus *TaskStatus
	ToStatus   *TaskStatus
	Text       *string
	DueDate    *string
	CreatedAt  time.Time
	ReadAt     *time.Time
	EmailedAt  *time.Time
}

// SetRead marks the notification read (keeping the first read time) or unread.
func (n *Notification) SetRead(read bool, now time.Time) {
	if !read {
		n.ReadAt = nil
		return
	}
	if n.ReadAt == nil {
		n.ReadAt = &now
	}
}

// TaskRecipients — who hears about a change of the task: the author and the assignee, once each,
// never the actor (ADR-0038).
func TaskRecipients(task *Task, actor UserID) []UserID {
	var ids []UserID
	for _, id := range []*UserID{&task.AuthorID, task.AssigneeID} {
		if id == nil || *id == actor {
			continue
		}
		if len(ids) > 0 && ids[0] == *id {
			continue
		}
		ids = append(ids, *id)
	}
	return ids
}

// commentExcerptRunes — how much of a comment a notification keeps (ADR-0038).
const commentExcerptRunes = 200

// CommentExcerpt — the start of a comment for a notification: whitespace runs, line breaks
// included, become one space; longer than 200 runes — cut with "…".
func CommentExcerpt(text string) string {
	s := strings.Join(strings.Fields(text), " ")
	if utf8.RuneCountInString(s) <= commentExcerptRunes {
		return s
	}
	return string([]rune(s)[:commentExcerptRunes]) + "…"
}
