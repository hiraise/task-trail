package project

import (
	"context"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// ListMembersService — участники проекта: видит любой участник.
type ListMembersService struct {
	members repository.ProjectMemberRepository
}

func (s *ListMembersService) Execute(ctx context.Context, userID, projectID string) ([]*repository.MemberView, error) {
	member, err := s.members.Get(ctx, entity.ProjectID(projectID), entity.UserID(userID))
	if err != nil {
		return nil, err
	}
	return s.members.List(ctx, member.ProjectID)
}

// AddMembersService зовёт почты в проект: владелец или администратор (ADR-0016).
type AddMembersService struct {
	txManager transaction.TxManager
	access    *access
	inviter   *inviter
}

func (s *AddMembersService) Execute(ctx context.Context, userID, projectID string, emails []string) ([]dto.InvitationResult, error) {
	by, err := s.access.currentUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	env, err := s.inviter.env(ctx)
	if err != nil {
		return nil, err
	}
	var invitations []*invitation
	f := func(ctx context.Context) error {
		project, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.RequireManager(); err != nil {
			return err
		}
		invitations, err = s.inviter.invite(ctx, env, project, by, emails)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	s.inviter.send(ctx, env, invitations)
	return results(invitations), nil
}

// ChangeRoleService — владелец назначает участнику роль администратора или участника.
type ChangeRoleService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	members   repository.ProjectMemberRepository
	users     repository.UserRepository
}

func (s *ChangeRoleService) Execute(ctx context.Context, userID, projectID, targetID string, role entity.ProjectRole) (*repository.MemberView, error) {
	var view *repository.MemberView
	f := func(ctx context.Context) error {
		project, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		// Не владельцу — 403, даже если такого участника нет
		if err := member.RequireOwner(); err != nil {
			return err
		}
		target, err := s.members.Get(ctx, project.ID, entity.UserID(targetID))
		if err != nil {
			return err
		}
		if err := member.ChangeRoleOf(target, role, s.clock.Now()); err != nil {
			return err
		}
		if err := s.members.UpdateRole(ctx, target); err != nil {
			return err
		}
		user, err := s.users.GetByID(ctx, target.UserID)
		if err != nil {
			return err
		}
		view = &repository.MemberView{User: user, Member: target}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// RemoveMemberService исключает участника; его задачи в проекте остаются без исполнителя.
type RemoveMemberService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	members   repository.ProjectMemberRepository
	tasks     repository.TaskRepository
}

func (s *RemoveMemberService) Execute(ctx context.Context, userID, projectID, targetID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		project, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		// Участнику — 403, даже если исключать некого
		if err := member.RequireManager(); err != nil {
			return err
		}
		target, err := s.members.Get(ctx, project.ID, entity.UserID(targetID))
		if err != nil {
			return err
		}
		if err := member.CheckRemove(target); err != nil {
			return err
		}
		return leave(ctx, s.members, s.tasks, target, s.clock.Now())
	})
}

// LeaveService — выход из проекта: администратор или участник. Задачи вышедшего в проекте
// остаются без исполнителя.
type LeaveService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	members   repository.ProjectMemberRepository
	tasks     repository.TaskRepository
}

func (s *LeaveService) Execute(ctx context.Context, userID, projectID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		_, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.CheckLeave(); err != nil {
			return err
		}
		return leave(ctx, s.members, s.tasks, member, s.clock.Now())
	})
}

// leave убирает участие и снимает человека с задач проекта.
func leave(ctx context.Context, members repository.ProjectMemberRepository, tasks repository.TaskRepository, m *entity.ProjectMember, now time.Time) error {
	if err := members.Remove(ctx, m.ProjectID, m.UserID); err != nil {
		return err
	}
	return tasks.UnassignInProject(ctx, m.ProjectID, m.UserID, now)
}
