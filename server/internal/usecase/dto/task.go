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
