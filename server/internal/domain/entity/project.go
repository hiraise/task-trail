package entity

import "time"

// Project — проект. Удаляется мягко вместе с задачами (ADR-0001): удалённый проект
// и всё, что к нему относится, пользователям не видны.
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

// Describe меняет описание; nil — описания нет.
func (p *Project) Describe(description *string, now time.Time) {
	p.Description = description
	p.UpdatedAt = now
}
