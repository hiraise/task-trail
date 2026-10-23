package response

import (
	"time"

	"task-trail/internal/domain/entity"
)

// Task is a task (Task in the contract).
type Task struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
	Number      int       `json:"number"`
	Key         string    `json:"key"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	StatusID    string    `json:"statusId"`
	AuthorID    string    `json:"authorId"`
	AssigneeID  *string   `json:"assigneeId"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func NewTask(t *entity.Task) Task {
	var assignee *string
	if t.AssigneeID != nil {
		id := string(*t.AssigneeID)
		assignee = &id
	}
	// Time is in UTC (ADR-0018): the database returns it in the server's time zone
	return Task{
		ID:          string(t.ID),
		ProjectID:   string(t.ProjectID),
		Number:      t.Number,
		Key:         t.Key(),
		Name:        t.Name,
		Description: t.Description,
		StatusID:    string(t.Status),
		AuthorID:    string(t.AuthorID),
		AssigneeID:  assignee,
		CreatedAt:   t.CreatedAt.UTC(),
		UpdatedAt:   t.UpdatedAt.UTC(),
	}
}

func NewTasks(tasks []*entity.Task) []Task {
	out := make([]Task, len(tasks))
	for i, t := range tasks {
		out[i] = NewTask(t)
	}
	return out
}

// TaskStatus is a task status (TaskStatus in the contract).
type TaskStatus struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsDefault  bool   `json:"isDefault"`
	IsResolved bool   `json:"isResolved"`
}

func NewTaskStatuses(statuses []entity.TaskStatusInfo) []TaskStatus {
	out := make([]TaskStatus, len(statuses))
	for i, s := range statuses {
		out[i] = TaskStatus{ID: string(s.ID), Name: s.Name, IsDefault: s.IsDefault, IsResolved: s.IsResolved}
	}
	return out
}
