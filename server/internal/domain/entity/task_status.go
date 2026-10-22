package entity

// TaskStatus — a task status (ADR-0003). The set is fixed and the same in all projects
// (ADR-0004); IDs are permanent: clients compare statuses by them, names are for display only.
type TaskStatus string

const (
	StatusOpen       TaskStatus = "open"
	StatusInProgress TaskStatus = "in_progress"
	StatusInReview   TaskStatus = "in_review"
	StatusDone       TaskStatus = "done"
)

// TaskStatusInfo — a status for the client (TaskStatus in the contract).
type TaskStatusInfo struct {
	ID TaskStatus
	// Name — the name for the UI.
	Name string
	// IsDefault — the status of a new task.
	IsDefault bool
	// IsResolved — the task is done.
	IsResolved bool
}

// taskStatuses — in the order of work on a task.
var taskStatuses = []TaskStatusInfo{
	{ID: StatusOpen, Name: "Открыта", IsDefault: true},
	{ID: StatusInProgress, Name: "В работе"},
	{ID: StatusInReview, Name: "На проверке"},
	{ID: StatusDone, Name: "Готово", IsResolved: true},
}

// TaskStatuses — all statuses in the order of work on a task.
func TaskStatuses() []TaskStatusInfo {
	out := make([]TaskStatusInfo, len(taskStatuses))
	copy(out, taskStatuses)
	return out
}

// defaultTaskStatus — the status of a new task.
func defaultTaskStatus() TaskStatus {
	for _, s := range taskStatuses {
		if s.IsDefault {
			return s.ID
		}
	}
	panic("no default task status")
}

// Valid — the status is in the set.
func (s TaskStatus) Valid() bool {
	for _, known := range taskStatuses {
		if known.ID == s {
			return true
		}
	}
	return false
}
