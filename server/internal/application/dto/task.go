package dto

type CreateTask struct {
	ProjectID   string
	Name        string
	Description *string
	// AssigneeID — исполнитель или nil.
	AssigneeID *string
}

// TaskChanges — что поменять в задаче: Name — если не nil; описание — если DescriptionSet,
// nil в Description убирает описание.
type TaskChanges struct {
	Name           *string
	DescriptionSet bool
	Description    *string
}
