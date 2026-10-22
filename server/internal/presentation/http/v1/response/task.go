package response

import (
	"time"

	"task-trail/internal/domain/entity"
)

// Task — задача (Task в контракте).
type Task struct {
	ID          string    `json:"id"`
	ProjectID   string    `json:"projectId"`
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
	// Время — в UTC (ADR-0018): из базы оно приходит в поясе сервера
	return Task{
		ID:          string(t.ID),
		ProjectID:   string(t.ProjectID),
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

// TaskStatus — статус задачи (TaskStatus в контракте).
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
