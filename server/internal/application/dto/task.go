package dto

type CreateTask struct {
	ProjectID   string
	Name        string
	Description *string
	// AssigneeID is the assignee or nil.
	AssigneeID *string
}

// TaskChanges is what to change in a task: Name if not nil; the description if DescriptionSet,
// nil in Description removes the description.
type TaskChanges struct {
	Name           *string
	DescriptionSet bool
	Description    *string
}
