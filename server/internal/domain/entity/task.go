package entity

import (
	"time"

	"task-trail/internal/domain"
)

type TaskID string

// Task — a project task. Fields are fixed (ADR-0004), each change is a separate operation
// (ADR-0002). Deleted softly: alone or together with the project (ADR-0001).
type Task struct {
	ID          TaskID
	ProjectID   ProjectID
	Name        string
	Description *string
	Status      TaskStatus
	AuthorID    UserID
	// AssigneeID — the assignee, a member of the task's project, or nil.
	AssigneeID *UserID
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// NewTask — a new task in the default status; assignee — the assignee's membership in the project
// or nil.
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

// Describe changes the description; nil — no description.
func (t *Task) Describe(description *string, now time.Time) {
	t.Description = description
	t.UpdatedAt = now
}

func (t *Task) ChangeStatus(status TaskStatus, now time.Time) {
	t.Status = status
	t.UpdatedAt = now
}

// AssignTo sets the assignee by their project membership; nil removes the assignee.
// The assignee must be a member of the task's project.
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

// MoveTo moves the task to project projectID; the status is kept. assignee — the current
// assignee's membership in the new project or nil: a non-member of the new project does not stay
// the assignee.
func (t *Task) MoveTo(projectID ProjectID, assignee *ProjectMember, now time.Time) {
	stays := t.AssigneeID != nil && assignee != nil &&
		assignee.ProjectID == projectID && assignee.UserID == *t.AssigneeID
	t.ProjectID = projectID
	if !stays {
		t.AssigneeID = nil
	}
	t.UpdatedAt = now
}
