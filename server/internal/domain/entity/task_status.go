package entity

// TaskStatus — статус задачи (ADR-0003). Набор фиксирован и одинаков во всех проектах
// (ADR-0004); ID постоянны: по ним клиенты сравнивают статусы, названия — только для показа.
type TaskStatus string

const (
	StatusOpen       TaskStatus = "open"
	StatusInProgress TaskStatus = "in_progress"
	StatusInReview   TaskStatus = "in_review"
	StatusDone       TaskStatus = "done"
)

// TaskStatusInfo — статус для клиента (TaskStatus в контракте).
type TaskStatusInfo struct {
	ID TaskStatus
	// Name — название для интерфейса.
	Name string
	// IsDefault — статус новой задачи.
	IsDefault bool
	// IsResolved — задача выполнена.
	IsResolved bool
}

// taskStatuses — в порядке работы над задачей.
var taskStatuses = []TaskStatusInfo{
	{ID: StatusOpen, Name: "Открыта", IsDefault: true},
	{ID: StatusInProgress, Name: "В работе"},
	{ID: StatusInReview, Name: "На проверке"},
	{ID: StatusDone, Name: "Готово", IsResolved: true},
}

// TaskStatuses — все статусы в порядке работы над задачей.
func TaskStatuses() []TaskStatusInfo {
	out := make([]TaskStatusInfo, len(taskStatuses))
	copy(out, taskStatuses)
	return out
}

// defaultTaskStatus — статус новой задачи.
func defaultTaskStatus() TaskStatus {
	for _, s := range taskStatuses {
		if s.IsDefault {
			return s.ID
		}
	}
	panic("no default task status")
}

// Valid — статус из набора.
func (s TaskStatus) Valid() bool {
	for _, known := range taskStatuses {
		if known.ID == s {
			return true
		}
	}
	return false
}
