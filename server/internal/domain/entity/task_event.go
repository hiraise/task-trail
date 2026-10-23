package entity

import "time"

type TaskEventID string

// TaskEventKind — what changed in a task (ADR-0028). A new kind needs an ADR.
type TaskEventKind string

const (
	EventCreated         TaskEventKind = "created"
	EventEdited          TaskEventKind = "edited"
	EventStatusChanged   TaskEventKind = "status_changed"
	EventAssigneeChanged TaskEventKind = "assignee_changed"
	EventMoved           TaskEventKind = "moved"
	EventArchived        TaskEventKind = "archived"
	EventRestored        TaskEventKind = "restored"
	EventPriorityChanged TaskEventKind = "priority_changed"
	EventDueDateChanged  TaskEventKind = "due_date_changed"
	EventParentChanged   TaskEventKind = "parent_changed"
)

// TaskEvent — a row of task history, written by the operation itself in its transaction with
// the time of the change; never edited or deleted (ADR-0028). Change fields are set only by
// the kinds that use them: status_changed — FromStatus/ToStatus, priority_changed —
// FromPriority/ToPriority, due_date_changed — FromDueDate/ToDueDate (YYYY-MM-DD, nil — no date),
// assignee_changed — FromUser/ToUser (nil — no assignee), moved — FromKey/ToKey,
// parent_changed — FromKey/ToKey, the keys of the old and the new parent (nil — none, ADR-0036).
type TaskEvent struct {
	ID           TaskEventID
	TaskID       TaskID
	ActorID      UserID
	Kind         TaskEventKind
	FromStatus   *TaskStatus
	ToStatus     *TaskStatus
	FromPriority *TaskPriority
	ToPriority   *TaskPriority
	FromDueDate  *string
	ToDueDate    *string
	FromUser     *UserID
	ToUser       *UserID
	FromKey      *string
	ToKey        *string
	CreatedAt    time.Time
}

// UserIDs — the actor and the assignees the event mentions.
func (e *TaskEvent) UserIDs() []UserID {
	ids := []UserID{e.ActorID}
	for _, id := range []*UserID{e.FromUser, e.ToUser} {
		if id != nil {
			ids = append(ids, *id)
		}
	}
	return ids
}
