package entity

import "time"

type LabelID string

// LabelColor — a color of the fixed label palette (ADR-0035); the web draws it with
// --label-<color>-bg and --label-<color>-text tokens.
type LabelColor string

const (
	LabelGray   LabelColor = "gray"
	LabelRed    LabelColor = "red"
	LabelOrange LabelColor = "orange"
	LabelYellow LabelColor = "yellow"
	LabelGreen  LabelColor = "green"
	LabelTeal   LabelColor = "teal"
	LabelBlue   LabelColor = "blue"
	LabelPurple LabelColor = "purple"
)

// Valid — the color is in the palette.
func (c LabelColor) Valid() bool {
	switch c {
	case LabelGray, LabelRed, LabelOrange, LabelYellow, LabelGreen, LabelTeal, LabelBlue, LabelPurple:
		return true
	}
	return false
}

// MaxTaskLabels — a task has at most this many labels (ADR-0035).
const MaxTaskLabels = 10

// Label — a label of one project (ADR-0035). The name is unique in the project ignoring case.
type Label struct {
	ID        LabelID
	ProjectID ProjectID
	Name      string
	Color     LabelColor
	CreatedAt time.Time
	UpdatedAt time.Time
}

func NewLabel(id LabelID, projectID ProjectID, name string, color LabelColor, now time.Time) *Label {
	return &Label{ID: id, ProjectID: projectID, Name: name, Color: color, CreatedAt: now, UpdatedAt: now}
}

func (l *Label) Rename(name string, now time.Time) {
	l.Name = name
	l.UpdatedAt = now
}

func (l *Label) Recolor(color LabelColor, now time.Time) {
	l.Color = color
	l.UpdatedAt = now
}
