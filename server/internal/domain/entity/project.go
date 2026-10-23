package entity

import (
	"fmt"
	"time"

	"task-trail/internal/domain"
)

// ProjectKey — the project key, like DS: 2–10 upper-case letters of any alphabet and digits,
// starting with a letter (ADR-0026). Unique among non-deleted projects.
type ProjectKey string

// TaskKey returns the key of the project's task number: DS-12.
func (k ProjectKey) TaskKey(number int) string {
	return fmt.Sprintf("%s-%d", k, number)
}

// Project — a project. Deleted softly together with its tasks (ADR-0001): a deleted project
// and everything related to it are invisible to users.
type Project struct {
	ID          ProjectID
	Name        string
	Description *string
	Key         ProjectKey
	// ArchivedAt — when the project was archived; nil — the project is active (ADR-0027).
	ArchivedAt *time.Time
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// Archive puts the project into the archive: the project, its members and tasks become read-only
// until it is restored (ADR-0027). The tasks' own archive flags do not change. An archived project
// stays as it is.
func (p *Project) Archive(now time.Time) {
	if p.ArchivedAt != nil {
		return
	}
	p.ArchivedAt = &now
	p.UpdatedAt = now
}

// Restore returns the project from the archive; an active project stays as it is.
func (p *Project) Restore(now time.Time) {
	if p.ArchivedAt == nil {
		return
	}
	p.ArchivedAt = nil
	p.UpdatedAt = now
}

// RequireActive: an archived project, its members and tasks do not change — PROJECT_ARCHIVED.
func (p *Project) RequireActive() error {
	if p.ArchivedAt != nil {
		return domain.ErrProjectArchived("projectID", p.ID)
	}
	return nil
}

func (p *Project) Rename(name string, now time.Time) {
	p.Name = name
	p.UpdatedAt = now
}

// Describe changes the description; nil — no description.
func (p *Project) Describe(description *string, now time.Time) {
	p.Description = description
	p.UpdatedAt = now
}

// ChangeKey changes the project key; the keys of its tasks change with it, numbers stay (ADR-0026).
func (p *Project) ChangeKey(key ProjectKey, now time.Time) {
	p.Key = key
	p.UpdatedAt = now
}
