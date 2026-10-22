package entity

import "time"

// Project — a project. Deleted softly together with its tasks (ADR-0001): a deleted project
// and everything related to it are invisible to users.
type Project struct {
	ID          ProjectID
	Name        string
	Description *string
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
