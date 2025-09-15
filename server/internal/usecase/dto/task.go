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

type TaskEdit struct {
	Name        *string
	Description *string
}

type TaskUpdate struct {
	Name        *string
	Description *string
	ProjectID   *int
	AssigneeID  *int
	StatusID    *int
}

type TaskListRes struct {
	ID          int
	Name        string
	Description *string
	ProjectID   int
	CreatedAt   time.Time
	UpdatedAt   time.Time
	AuthorID    int
	AssigneeID  *int
	StatusID    *int
}
