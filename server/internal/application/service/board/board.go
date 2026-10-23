// Package board holds the use cases of boards (ADR-0029): a board is a view over tasks of several
// projects, board membership grants no access to tasks. A non-member of the board gets 404 before any
// owner check; a member who is not the owner gets 403.
package board

import (
	"context"
	"slices"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type BoardModule struct {
	List         *ListBoardsService
	Get          *GetBoardService
	Create       *CreateBoardService
	Rename       *RenameBoardService
	SetProjects  *SetBoardProjectsService
	AddMembers   *AddBoardMembersService
	RemoveMember *RemoveBoardMemberService
	Leave        *LeaveBoardService
	Delete       *DeleteBoardService
	ListTasks    *ListBoardTasksService
}

// Deps are the dependencies of the board module.
type Deps struct {
	TxManager    transaction.TxManager
	Clock        service.Clock
	BoardRepo    repository.BoardRepository
	BoardFactory *factory.BoardFactory
	MemberRepo   repository.ProjectMemberRepository
	UserRepo     repository.UserRepository
}

func New(d Deps) *BoardModule {
	a := &access{boards: d.BoardRepo}
	c := &checker{members: d.MemberRepo, accounts: d.UserRepo}
	return &BoardModule{
		List: &ListBoardsService{boards: d.BoardRepo},
		Get:  &GetBoardService{boards: d.BoardRepo},
		Create: &CreateBoardService{
			txManager: d.TxManager,
			boards:    d.BoardRepo,
			factory:   d.BoardFactory,
			checker:   c,
		},
		Rename:       &RenameBoardService{txManager: d.TxManager, clock: d.Clock, access: a, boards: d.BoardRepo},
		SetProjects:  &SetBoardProjectsService{txManager: d.TxManager, access: a, boards: d.BoardRepo, checker: c},
		AddMembers:   &AddBoardMembersService{txManager: d.TxManager, clock: d.Clock, access: a, boards: d.BoardRepo, checker: c},
		RemoveMember: &RemoveBoardMemberService{txManager: d.TxManager, access: a, boards: d.BoardRepo},
		Leave:        &LeaveBoardService{txManager: d.TxManager, access: a, boards: d.BoardRepo},
		Delete:       &DeleteBoardService{txManager: d.TxManager, access: a, boards: d.BoardRepo},
		ListTasks:    &ListBoardTasksService{access: a, boards: d.BoardRepo},
	}
}

// access finds a board for its member.
type access struct {
	boards repository.BoardRepository
}

// lock locks the board until the end of the transaction. A missing board or a non-member:
// ENTITY_NOT_FOUND, the board's existence is not revealed (ADR-0029).
func (a *access) lock(ctx context.Context, boardID, userID string) (*entity.Board, error) {
	board, err := a.boards.GetForUpdate(ctx, entity.BoardID(boardID))
	if err != nil {
		return nil, err
	}
	if err := a.requireMember(ctx, board.ID, entity.UserID(userID)); err != nil {
		return nil, err
	}
	return board, nil
}

func (a *access) requireMember(ctx context.Context, boardID entity.BoardID, userID entity.UserID) error {
	member, err := a.boards.IsMember(ctx, boardID, userID)
	if err != nil {
		return err
	}
	if !member {
		return domain.ErrEntityNotFound(0, nil, "boardID", boardID, "userID", userID, "reason", "not a board member")
	}
	return nil
}

// checker checks what the owner puts on a board (ADR-0029).
type checker struct {
	members  repository.ProjectMemberRepository
	accounts repository.UserRepository
}

// projects: the owner is a member of each project, otherwise BOARD_PROJECT_UNAVAILABLE. Returns
// the IDs without repeats.
func (c *checker) projects(ctx context.Context, ownerID entity.UserID, ids []string) ([]entity.ProjectID, error) {
	out := make([]entity.ProjectID, 0, len(ids))
	for _, id := range ids {
		projectID := entity.ProjectID(id)
		if slices.Contains(out, projectID) {
			continue
		}
		_, err := c.members.Get(ctx, projectID, ownerID)
		if domain.HasCode(err, domain.EntityNotFound) {
			return nil, domain.ErrBoardProjectUnavailable("projectID", projectID, "ownerID", ownerID)
		}
		if err != nil {
			return nil, err
		}
		out = append(out, projectID)
	}
	return out, nil
}

// users: each user shares a project with the owner (the candidates of a project invitation), otherwise
// BOARD_MEMBER_UNAVAILABLE. The owner is skipped; returns the IDs without repeats.
func (c *checker) users(ctx context.Context, ownerID entity.UserID, ids []string) ([]entity.UserID, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	candidates, err := c.accounts.ListCandidates(ctx, ownerID, nil)
	if err != nil {
		return nil, err
	}
	out := make([]entity.UserID, 0, len(ids))
	for _, id := range ids {
		userID := entity.UserID(id)
		if userID == ownerID || slices.Contains(out, userID) {
			continue
		}
		if !slices.ContainsFunc(candidates, func(u *entity.UserAccount) bool { return u.ID == userID }) {
			return nil, domain.ErrBoardMemberUnavailable("userID", userID, "ownerID", ownerID)
		}
		out = append(out, userID)
	}
	return out, nil
}

// ListBoardsService returns the boards where the user is a member.
type ListBoardsService struct {
	boards repository.BoardRepository
}

func (s *ListBoardsService) Execute(ctx context.Context, userID string) ([]*repository.BoardView, error) {
	return s.boards.ListViews(ctx, entity.UserID(userID))
}

// GetBoardService returns a board to its member; a non-member gets ENTITY_NOT_FOUND.
type GetBoardService struct {
	boards repository.BoardRepository
}

func (s *GetBoardService) Execute(ctx context.Context, userID, boardID string) (*repository.BoardView, error) {
	return s.boards.GetView(ctx, entity.BoardID(boardID), entity.UserID(userID))
}

// CreateBoardService creates a board: any signed-in user, who becomes its owner.
type CreateBoardService struct {
	txManager transaction.TxManager
	boards    repository.BoardRepository
	factory   *factory.BoardFactory
	checker   *checker
}

func (s *CreateBoardService) Execute(ctx context.Context, userID string, data dto.CreateBoard) (*repository.BoardView, error) {
	ownerID := entity.UserID(userID)
	var view *repository.BoardView
	f := func(ctx context.Context) error {
		projects, err := s.checker.projects(ctx, ownerID, data.ProjectIDs)
		if err != nil {
			return err
		}
		members, err := s.checker.users(ctx, ownerID, data.MemberIDs)
		if err != nil {
			return err
		}
		board := s.factory.New(data.Name, ownerID)
		if err := s.boards.Create(ctx, board, projects); err != nil {
			return err
		}
		if err := s.boards.AddMembers(ctx, board.ID, members, board.CreatedAt); err != nil {
			return err
		}
		view, err = s.boards.GetView(ctx, board.ID, ownerID)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// RenameBoardService: only the owner.
type RenameBoardService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	boards    repository.BoardRepository
}

func (s *RenameBoardService) Execute(ctx context.Context, userID, boardID, name string) (*repository.BoardView, error) {
	var view *repository.BoardView
	f := func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		if err := board.RequireOwner(entity.UserID(userID)); err != nil {
			return err
		}
		board.Rename(name, s.clock.Now())
		if err := s.boards.Update(ctx, board); err != nil {
			return err
		}
		view, err = s.boards.GetView(ctx, board.ID, board.OwnerID)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// SetBoardProjectsService replaces the board projects the owner sees; the others stay (ADR-0029).
type SetBoardProjectsService struct {
	txManager transaction.TxManager
	access    *access
	boards    repository.BoardRepository
	checker   *checker
}

func (s *SetBoardProjectsService) Execute(ctx context.Context, userID, boardID string, projectIDs []string) (*repository.BoardView, error) {
	var view *repository.BoardView
	f := func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		if err := board.RequireOwner(entity.UserID(userID)); err != nil {
			return err
		}
		projects, err := s.checker.projects(ctx, board.OwnerID, projectIDs)
		if err != nil {
			return err
		}
		if err := s.boards.ReplaceProjects(ctx, board.ID, board.OwnerID, projects); err != nil {
			return err
		}
		view, err = s.boards.GetView(ctx, board.ID, board.OwnerID)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// AddBoardMembersService: the owner adds people who share a project with them; those already on
// the board stay as they are.
type AddBoardMembersService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	boards    repository.BoardRepository
	checker   *checker
}

func (s *AddBoardMembersService) Execute(ctx context.Context, userID, boardID string, userIDs []string) (*repository.BoardView, error) {
	var view *repository.BoardView
	f := func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		if err := board.RequireOwner(entity.UserID(userID)); err != nil {
			return err
		}
		members, err := s.checker.users(ctx, board.OwnerID, userIDs)
		if err != nil {
			return err
		}
		if err := s.boards.AddMembers(ctx, board.ID, members, s.clock.Now()); err != nil {
			return err
		}
		view, err = s.boards.GetView(ctx, board.ID, board.OwnerID)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// RemoveBoardMemberService: the owner removes a member, but not themselves — OWNER_CANNOT_LEAVE.
type RemoveBoardMemberService struct {
	txManager transaction.TxManager
	access    *access
	boards    repository.BoardRepository
}

func (s *RemoveBoardMemberService) Execute(ctx context.Context, userID, boardID, targetID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		// A member gets 403, even if there is nobody to remove
		if err := board.RequireOwner(entity.UserID(userID)); err != nil {
			return err
		}
		if err := board.CheckLeave(entity.UserID(targetID)); err != nil {
			return err
		}
		return s.boards.RemoveMember(ctx, board.ID, entity.UserID(targetID))
	})
}

// LeaveBoardService: a member leaves the board; the owner deletes it instead — OWNER_CANNOT_LEAVE.
type LeaveBoardService struct {
	txManager transaction.TxManager
	access    *access
	boards    repository.BoardRepository
}

func (s *LeaveBoardService) Execute(ctx context.Context, userID, boardID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		if err := board.CheckLeave(entity.UserID(userID)); err != nil {
			return err
		}
		return s.boards.RemoveMember(ctx, board.ID, entity.UserID(userID))
	})
}

// DeleteBoardService deletes a board at once: only the owner; tasks stay (ADR-0029).
type DeleteBoardService struct {
	txManager transaction.TxManager
	access    *access
	boards    repository.BoardRepository
}

func (s *DeleteBoardService) Execute(ctx context.Context, userID, boardID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		board, err := s.access.lock(ctx, boardID, userID)
		if err != nil {
			return err
		}
		if err := board.RequireOwner(entity.UserID(userID)); err != nil {
			return err
		}
		return s.boards.Delete(ctx, board.ID)
	})
}

// ListBoardTasksService returns the board tasks the member sees (ADR-0029).
type ListBoardTasksService struct {
	access *access
	boards repository.BoardRepository
}

func (s *ListBoardTasksService) Execute(ctx context.Context, userID, boardID string) ([]*entity.Task, error) {
	id, viewer := entity.BoardID(boardID), entity.UserID(userID)
	if err := s.access.requireMember(ctx, id, viewer); err != nil {
		return nil, err
	}
	return s.boards.ListTasks(ctx, id, viewer)
}
