package dto

import "time"

type Task struct {
	ID          int
	ProjectID   int
	Name        string
	Description string
	CreatedAt   time.Time
	AuthorID    int
}

type TaskCreate struct {
	Name        string
	Description *string
	ProjectID   int
	AuthorID    int
	AssigneeID  *int
	StatusID    *int
}

type TaskListRes struct {
	ID          int
	Name        string
	Description *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	AuthorID    *int
	AssigneeID  *int
	StatusID    *int
}
