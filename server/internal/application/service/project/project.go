// Package project — сценарии проектов и их участников: роли по ADR-0003, приглашения
// по ADR-0016 и ADR-0017, мягкое удаление по ADR-0001.
package project

import (
	"context"

	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type ProjectModule struct {
	List         *ListProjectsService
	Get          *GetProjectService
	Create       *CreateProjectService
	Update       *UpdateProjectService
	Delete       *DeleteProjectService
	Candidates   *CandidatesService
	Members      *ListMembersService
	AddMembers   *AddMembersService
	ChangeRole   *ChangeRoleService
	RemoveMember *RemoveMemberService
	Leave        *LeaveService
}

// Deps — зависимости модуля проектов.
type Deps struct {
	TxManager         transaction.TxManager
	Clock             service.Clock
	ProjectRepo       repository.ProjectRepository
	ProjectFactory    *factory.ProjectFactory
	MemberRepo        repository.ProjectMemberRepository
	UserRepo          repository.UserRepository
	TaskRepo          repository.TaskRepository
	InvitationRepo    repository.InvitationRepository
	InvitationFactory *factory.InvitationFactory
	SettingsRepo      repository.SettingsRepository
	Mailer            service.Mailer
}

func New(d Deps) *ProjectModule {
	access := &access{projects: d.ProjectRepo, members: d.MemberRepo, users: d.UserRepo}
	invitations := &inviter{
		clock:       d.Clock,
		users:       d.UserRepo,
		members:     d.MemberRepo,
		invitations: d.InvitationRepo,
		factory:     d.InvitationFactory,
		settings:    d.SettingsRepo,
		mailer:      d.Mailer,
	}
	return &ProjectModule{
		List: &ListProjectsService{projects: d.ProjectRepo},
		Get:  &GetProjectService{projects: d.ProjectRepo},
		Create: &CreateProjectService{
			txManager: d.TxManager,
			access:    access,
			projects:  d.ProjectRepo,
			factory:   d.ProjectFactory,
			members:   d.MemberRepo,
			inviter:   invitations,
		},
		Update:     &UpdateProjectService{txManager: d.TxManager, clock: d.Clock, access: access, projects: d.ProjectRepo},
		Delete:     &DeleteProjectService{txManager: d.TxManager, clock: d.Clock, access: access, projects: d.ProjectRepo},
		Candidates: &CandidatesService{members: d.MemberRepo, users: d.UserRepo},
		Members:    &ListMembersService{members: d.MemberRepo},
		AddMembers: &AddMembersService{txManager: d.TxManager, access: access, inviter: invitations},
		ChangeRole: &ChangeRoleService{
			txManager: d.TxManager,
			clock:     d.Clock,
			access:    access,
			members:   d.MemberRepo,
			users:     d.UserRepo,
		},
		RemoveMember: &RemoveMemberService{
			txManager: d.TxManager,
			clock:     d.Clock,
			access:    access,
			members:   d.MemberRepo,
			tasks:     d.TaskRepo,
		},
		Leave: &LeaveService{
			txManager: d.TxManager,
			clock:     d.Clock,
			access:    access,
			members:   d.MemberRepo,
			tasks:     d.TaskRepo,
		},
	}
}

// access находит проект и участие в нём.
type access struct {
	projects repository.ProjectRepository
	members  repository.ProjectMemberRepository
	users    repository.UserRepository
}

// lock блокирует проект до конца транзакции и находит участие userID. Не участник или
// проекта нет — ENTITY_NOT_FOUND: существование проекта не выдаём (ADR-0018).
func (a *access) lock(ctx context.Context, projectID, userID string) (*entity.Project, *entity.ProjectMember, error) {
	project, err := a.projects.GetForUpdate(ctx, entity.ProjectID(projectID))
	if err != nil {
		return nil, nil, err
	}
	member, err := a.members.Get(ctx, project.ID, entity.UserID(userID))
	if err != nil {
		return nil, nil, err
	}
	return project, member, nil
}

// currentUser — пользователь, который вошёл. Его удалили, а access-токен ещё жив:
// сессия недействительна, это 401, а не 404.
func (a *access) currentUser(ctx context.Context, userID string) (*entity.UserAccount, error) {
	user, err := a.users.GetByID(ctx, entity.UserID(userID))
	if domain.HasCode(err, domain.EntityNotFound) {
		return nil, domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
	}
	return user, err
}
