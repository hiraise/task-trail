package entity

import (
	"time"

	"task-trail/internal/domain"
)

type TaskID string

// Task — задача проекта. Поля фиксированы (ADR-0004), каждое изменение — своя операция
// (ADR-0002). Удаляется мягко: одна или вместе с проектом (ADR-0001).
type Task struct {
	ID          TaskID
	ProjectID   ProjectID
	Name        string
	Description *string
	Status      TaskStatus
	AuthorID    UserID
	// AssigneeID — исполнитель, участник проекта задачи, или nil.
	AssigneeID *UserID
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// NewTask — новая задача в статусе по умолчанию; assignee — участие исполнителя в проекте
// или nil.
func NewTask(id TaskID, projectID ProjectID, authorID UserID, name string, description *string, assignee *ProjectMember, now time.Time) (*Task, error) {
	t := &Task{
		ID:          id,
		ProjectID:   projectID,
		Name:        name,
		Description: description,
		Status:      defaultTaskStatus(),
		AuthorID:    authorID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := t.AssignTo(assignee, now); err != nil {
		return nil, err
	}
	return t, nil
}

func (t *Task) Rename(name string, now time.Time) {
	t.Name = name
	t.UpdatedAt = now
}

// Describe меняет описание; nil — описания нет.
func (t *Task) Describe(description *string, now time.Time) {
	t.Description = description
	t.UpdatedAt = now
}

func (t *Task) ChangeStatus(status TaskStatus, now time.Time) {
	t.Status = status
	t.UpdatedAt = now
}

// AssignTo назначает исполнителя по его участию в проекте; nil снимает исполнителя.
// Исполнитель — только участник проекта задачи.
func (t *Task) AssignTo(assignee *ProjectMember, now time.Time) error {
	if assignee == nil {
		t.AssigneeID = nil
		t.UpdatedAt = now
		return nil
	}
	if assignee.ProjectID != t.ProjectID {
		return domain.ErrAssigneeNotMember("taskID", t.ID, "projectID", t.ProjectID, "assigneeID", assignee.UserID)
	}
	id := assignee.UserID
	t.AssigneeID = &id
	t.UpdatedAt = now
	return nil
}

// MoveTo переносит задачу в проект projectID; статус сохраняется. assignee — участие
// нынешнего исполнителя в новом проекте или nil: не участник нового проекта — исполнителем
// не остаётся.
func (t *Task) MoveTo(projectID ProjectID, assignee *ProjectMember, now time.Time) {
	stays := t.AssigneeID != nil && assignee != nil &&
		assignee.ProjectID == projectID && assignee.UserID == *t.AssigneeID
	t.ProjectID = projectID
	if !stays {
		t.AssigneeID = nil
	}
	t.UpdatedAt = now
}
