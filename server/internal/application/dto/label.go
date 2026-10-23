package dto

import "task-trail/internal/domain/entity"

// LabelData — a new label of a project (ADR-0035).
type LabelData struct {
	Name  string
	Color entity.LabelColor
}

// LabelChanges — the label fields to change; nil — leave as is.
type LabelChanges struct {
	Name  *string
	Color *entity.LabelColor
}
