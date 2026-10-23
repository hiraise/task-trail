package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// BoardProject — a board project as the viewer sees it.
type BoardProject struct {
	ID         entity.ProjectID
	Name       string
	Key        entity.ProjectKey
	ArchivedAt *time.Time
}

// BoardView — a board as member viewerID sees it (ADR-0029).
type BoardView struct {
	Board *entity.Board
	// Projects — non-deleted board projects where the viewer is a project member, by name.
	Projects []BoardProject
	// Members — board members: the owner first, the others in order of joining.
	Members []*entity.UserAccount
	// TasksCount — the same tasks as ListTasks returns to the viewer.
	TasksCount int
}

// BoardRepository — boards, their projects and members. A board is deleted at once (ADR-0029).
type BoardRepository interface {
	// Create writes the board, its owner as a member and its projects.
	Create(ctx context.Context, board *entity.Board, projectIDs []entity.ProjectID) error
	// GetForUpdate locks the board row until the end of the transaction. Scenarios that change a board,
	// its projects or members start with it.
	GetForUpdate(ctx context.Context, id entity.BoardID) (*entity.Board, error)
	IsMember(ctx context.Context, id entity.BoardID, userID entity.UserID) (bool, error)
	// GetView — the board as member viewerID sees it; a non-member gets ENTITY_NOT_FOUND.
	GetView(ctx context.Context, id entity.BoardID, viewerID entity.UserID) (*BoardView, error)
	// ListViews — boards where viewerID is a member, newest first.
	ListViews(ctx context.Context, viewerID entity.UserID) ([]*BoardView, error)
	// Update writes the name and update time.
	Update(ctx context.Context, board *entity.Board) error
	// ReplaceProjects replaces the board projects that ownerID sees with projectIDs; projects the owner
	// is not a member of stay on the board (ADR-0029).
	ReplaceProjects(ctx context.Context, id entity.BoardID, ownerID entity.UserID, projectIDs []entity.ProjectID) error
	// AddMembers adds board members; those already on the board are skipped.
	AddMembers(ctx context.Context, id entity.BoardID, userIDs []entity.UserID, now time.Time) error
	// RemoveMember removes a board member; not a member — ENTITY_NOT_FOUND.
	RemoveMember(ctx context.Context, id entity.BoardID, userID entity.UserID) error
	Delete(ctx context.Context, id entity.BoardID) error
	// ListTasks — board tasks as viewerID sees them (ADR-0029): tasks of the board projects where the
	// viewer is a project member; neither the task nor its project is archived or deleted; the assignee is
	// a board member or nobody. Recently updated first. Fills Task.ProjectKey and Task.ProjectArchived.
	ListTasks(ctx context.Context, id entity.BoardID, viewerID entity.UserID) ([]*entity.Task, error)
}
