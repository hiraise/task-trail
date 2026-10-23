package response

import (
	"time"

	"task-trail/internal/domain/repository"
)

// BoardProject is a board project the viewer sees (BoardProject in the contract).
type BoardProject struct {
	ID         string     `json:"id"`
	Name       string     `json:"name"`
	Key        string     `json:"key"`
	ArchivedAt *time.Time `json:"archivedAt"`
}

// Board is a board as its member sees it (Board in the contract, ADR-0029).
type Board struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	OwnerID    string         `json:"ownerId"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	Projects   []BoardProject `json:"projects"`
	Members    []User         `json:"members"`
	TasksCount int            `json:"tasksCount"`
}

func NewBoard(v *repository.BoardView) Board {
	b := v.Board
	projects := make([]BoardProject, len(v.Projects))
	for i, p := range v.Projects {
		projects[i] = BoardProject{ID: string(p.ID), Name: p.Name, Key: string(p.Key), ArchivedAt: utc(p.ArchivedAt)}
	}
	return Board{
		ID:         string(b.ID),
		Name:       b.Name,
		OwnerID:    string(b.OwnerID),
		CreatedAt:  b.CreatedAt.UTC(),
		UpdatedAt:  b.UpdatedAt.UTC(),
		Projects:   projects,
		Members:    NewUsers(v.Members),
		TasksCount: v.TasksCount,
	}
}

func NewBoards(views []*repository.BoardView) []Board {
	out := make([]Board, len(views))
	for i, v := range views {
		out[i] = NewBoard(v)
	}
	return out
}
