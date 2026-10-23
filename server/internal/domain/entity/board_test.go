package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
)

func TestBoardPermissions(t *testing.T) {
	now := time.Date(2026, 10, 23, 12, 0, 0, 0, time.UTC)
	board := &entity.Board{ID: "b", Name: "Релиз", OwnerID: "owner", CreatedAt: now, UpdatedAt: now}

	if err := board.RequireOwner("owner"); err != nil {
		t.Errorf("owner: %v", err)
	}
	if err := board.RequireOwner("member"); !domain.HasCode(err, domain.Forbidden) {
		t.Errorf("member: %v", err)
	}
	if err := board.CheckLeave("member"); err != nil {
		t.Errorf("member leaves: %v", err)
	}
	if err := board.CheckLeave("owner"); !domain.HasCode(err, domain.OwnerCannotLeave) {
		t.Errorf("owner leaves: %v", err)
	}

	later := now.Add(time.Hour)
	board.Rename("Релиз 2", later)
	if board.Name != "Релиз 2" || !board.UpdatedAt.Equal(later) {
		t.Errorf("rename: %+v", board)
	}
}
