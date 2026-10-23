package response

import "task-trail/internal/domain/entity"

// Label is a project label (Label in the contract, ADR-0035).
type Label struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	Name      string `json:"name"`
	Color     string `json:"color"`
}

func NewLabel(l *entity.Label) Label {
	return Label{ID: string(l.ID), ProjectID: string(l.ProjectID), Name: l.Name, Color: string(l.Color)}
}

func NewLabels(labels []*entity.Label) []Label {
	out := make([]Label, len(labels))
	for i, l := range labels {
		out[i] = NewLabel(l)
	}
	return out
}
