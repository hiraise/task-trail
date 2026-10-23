package dto

import "task-trail/internal/domain/entity"

type CreateTask struct {
	ProjectID   string
	Name        string
	Description *string
	// AssigneeID is the assignee or nil.
	AssigneeID *string
	// Status — the status of the new task; the request without statusId gets the default one.
	Status entity.TaskStatus
	// Priority — the priority of the new task; the request without priority gets normal (ADR-0033).
	Priority entity.TaskPriority
}

// TaskChanges is what to change in a task: Name if not nil; the description if DescriptionSet,
// nil in Description removes the description.
type TaskChanges struct {
	Name           *string
	DescriptionSet bool
	Description    *string
}

// Comment is a task comment with its author (ADR-0028).
type Comment struct {
	Comment *entity.Comment
	Author  *entity.UserAccount
}

// TaskEvent is a task history row with the people it mentions; FromUser and ToUser are nil when
// the event has no such assignee.
type TaskEvent struct {
	Event    *entity.TaskEvent
	Actor    *entity.UserAccount
	FromUser *entity.UserAccount
	ToUser   *entity.UserAccount
}
