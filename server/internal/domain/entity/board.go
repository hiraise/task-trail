package entity

import (
	"time"

	"task-trail/internal/domain"
)

type BoardID string

// Board — a view over tasks of several projects (ADR-0029). Board membership grants no access to
// tasks: a member sees only the board projects where they are a project member. The owner is
// a member too.
type Board struct {
	ID        BoardID
	Name      string
	OwnerID   UserID
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (b *Board) Rename(name string, now time.Time) {
	b.Name = name
	b.UpdatedAt = now
}

// RequireOwner — only the owner renames the board, changes its projects and members and deletes it.
// The caller has already checked that userID is a board member: a non-member gets 404, not 403.
func (b *Board) RequireOwner(userID UserID) error {
	if b.OwnerID == userID {
		return nil
	}
	return domain.ErrForbidden("boardID", b.ID, "userID", userID, "reason", "board owner required")
}

// CheckLeave — a member can leave the board; the owner does not leave but deletes it.
func (b *Board) CheckLeave(userID UserID) error {
	if b.OwnerID == userID {
		return domain.ErrOwnerCannotLeave("boardID", b.ID, "userID", userID)
	}
	return nil
}
