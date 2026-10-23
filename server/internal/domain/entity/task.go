package entity

import (
	"time"

	"task-trail/internal/domain"
)

type TaskID string

// Task — a project task. Fields are fixed (ADR-0004), each change is a separate operation
// (ADR-0002). Deleted softly: alone or together with the project (ADR-0001).
type Task struct {
	ID        TaskID
	ProjectID ProjectID
	// Number — sequential within the project, never reused (ADR-0026).
	Number int
	// ProjectKey — the key of the task's project; read-only, repositories fill it from projects.key.
	ProjectKey  ProjectKey
	Name        string
	Description *string
	Status      TaskStatus
	AuthorID    UserID
	// AssigneeID — the assignee, a member of the task's project, or nil.
	AssigneeID *UserID
	// ArchivedAt — when the task was archived; nil — the task is active (ADR-0027).
	ArchivedAt *time.Time
	// ProjectArchived — whether the task's project is archived; read-only, repositories fill it
	// from projects.archived_at.
	ProjectArchived bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// NewTask — a new task in status status with number number of project projectKey;
// assignee — the assignee's membership in the project or nil.
func NewTask(id TaskID, projectID ProjectID, projectKey ProjectKey, number int, authorID UserID, name string, description *string, status TaskStatus, assignee *ProjectMember, now time.Time) (*Task, error) {
	t := &Task{
		ID:          id,
		ProjectID:   projectID,
		ProjectKey:  projectKey,
		Number:      number,
		Name:        name,
		Description: description,
		Status:      status,
		AuthorID:    authorID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := t.AssignTo(assignee, now); err != nil {
		return nil, err
	}
	return t, nil
}

// Key — the task key, like DS-12.
func (t *Task) Key() string {
	return t.ProjectKey.TaskKey(t.Number)
}

// Archive puts the task into the archive: it becomes read-only until restored (ADR-0027).
// An archived task stays as it is.
func (t *Task) Archive(now time.Time) {
	if t.ArchivedAt != nil {
		return
	}
	t.ArchivedAt = &now
	t.UpdatedAt = now
}

// Restore returns the task from the archive; an active task stays as it is.
func (t *Task) Restore(now time.Time) {
	if t.ArchivedAt == nil {
		return
	}
	t.ArchivedAt = nil
	t.UpdatedAt = now
}

// RequireActive: an archived task is changed only by restoring or deleting it — TASK_ARCHIVED.
// The task's project is checked separately, with Project.RequireActive.
func (t *Task) RequireActive() error {
	if t.ArchivedAt != nil {
		return domain.ErrTaskArchived("taskID", t.ID)
	}
	return nil
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

// MoveTo moves the task to project projectID with key projectKey, where it gets number number;
// the status is kept. assignee — the current assignee's membership in the new project or nil:
// a non-member of the new project does not stay the assignee.
func (t *Task) MoveTo(projectID ProjectID, projectKey ProjectKey, number int, assignee *ProjectMember, now time.Time) {
	stays := t.AssigneeID != nil && assignee != nil &&
		assignee.ProjectID == projectID && assignee.UserID == *t.AssigneeID
	t.ProjectID = projectID
	t.ProjectKey = projectKey
	t.Number = number
	if !stays {
		t.AssigneeID = nil
	}
	t.UpdatedAt = now
}
