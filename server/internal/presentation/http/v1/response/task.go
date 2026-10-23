package response

import (
	"time"

	"task-trail/internal/domain/entity"
)

// Task is a task (Task in the contract).
type Task struct {
	ID          string  `json:"id"`
	ProjectID   string  `json:"projectId"`
	Number      int     `json:"number"`
	Key         string  `json:"key"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	StatusID    string  `json:"statusId"`
	Priority    string  `json:"priority"`
	// DueDate — YYYY-MM-DD or nil (ADR-0034)
	DueDate    *string `json:"dueDate"`
	AuthorID   string  `json:"authorId"`
	AssigneeID *string `json:"assigneeId"`
	// ArchivedAt and ProjectArchived — the task's own archive and its project's (ADR-0027)
	ArchivedAt      *time.Time `json:"archivedAt"`
	ProjectArchived bool       `json:"projectArchived"`
	// Labels — ordered by name, never null (ADR-0035)
	Labels []Label `json:"labels"`
	// ParentID and the counters of non-archived subtasks (ADR-0036)
	ParentID      *string   `json:"parentId"`
	SubtasksTotal int       `json:"subtasksTotal"`
	SubtasksDone  int       `json:"subtasksDone"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func NewTask(t *entity.Task) Task {
	var assignee *string
	if t.AssigneeID != nil {
		id := string(*t.AssigneeID)
		assignee = &id
	}
	var dueDate *string
	if t.DueDate != nil {
		d := entity.FormatDueDate(*t.DueDate)
		dueDate = &d
	}
	var parent *string
	if t.ParentID != nil {
		id := string(*t.ParentID)
		parent = &id
	}
	labels := make([]Label, 0, len(t.Labels))
	for i := range t.Labels {
		labels = append(labels, NewLabel(&t.Labels[i]))
	}
	// Time is in UTC (ADR-0018): the database returns it in the server's time zone
	return Task{
		ID:              string(t.ID),
		ProjectID:       string(t.ProjectID),
		Number:          t.Number,
		Key:             t.Key(),
		Name:            t.Name,
		Description:     t.Description,
		StatusID:        string(t.Status),
		Priority:        string(t.Priority),
		DueDate:         dueDate,
		AuthorID:        string(t.AuthorID),
		AssigneeID:      assignee,
		ArchivedAt:      utc(t.ArchivedAt),
		ProjectArchived: t.ProjectArchived,
		Labels:          labels,
		ParentID:        parent,
		SubtasksTotal:   t.SubtasksTotal,
		SubtasksDone:    t.SubtasksDone,
		CreatedAt:       t.CreatedAt.UTC(),
		UpdatedAt:       t.UpdatedAt.UTC(),
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

// utc is an optional time in UTC (ADR-0018).
func utc(t *time.Time) *time.Time {
	if t == nil {
		return nil
	}
	u := t.UTC()
	return &u
}
