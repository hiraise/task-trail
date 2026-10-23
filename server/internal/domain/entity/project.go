package entity

import (
	"fmt"
	"time"
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
	CreatedAt   time.Time
	UpdatedAt   time.Time
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
