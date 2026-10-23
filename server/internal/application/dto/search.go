package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// SearchResult — what a search found, by group (ADR-0030).
type SearchResult struct {
	Projects []*repository.ProjectView
	Boards   []*repository.BoardView
	Tasks    []*entity.Task
}
