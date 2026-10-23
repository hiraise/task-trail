// Package project holds the use cases of projects and their members: roles per ADR-0003, invitations
// per ADR-0016 and ADR-0017, soft deletion per ADR-0001, archive per ADR-0027: an archived project
// and its members do not change, except leaving, deleting and restoring it.
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
	SetArchived  *SetProjectArchivedService
	Delete       *DeleteProjectService
	Candidates   *CandidatesService
	Members      *ListMembersService
	AddMembers   *AddMembersService
	ChangeRole   *ChangeRoleService
	RemoveMember *RemoveMemberService
	Leave        *LeaveService
}

// Deps are the dependencies of the project module.
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
		Update:      &UpdateProjectService{txManager: d.TxManager, clock: d.Clock, access: access, projects: d.ProjectRepo},
		SetArchived: &SetProjectArchivedService{txManager: d.TxManager, clock: d.Clock, access: access, projects: d.ProjectRepo},
		Delete:      &DeleteProjectService{txManager: d.TxManager, clock: d.Clock, access: access, projects: d.ProjectRepo},
		Candidates:  &CandidatesService{members: d.MemberRepo, users: d.UserRepo},
		Members:     &ListMembersService{members: d.MemberRepo},
		AddMembers:  &AddMembersService{txManager: d.TxManager, access: access, inviter: invitations},
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

// access finds a project and the membership in it.
type access struct {
	projects repository.ProjectRepository
	members  repository.ProjectMemberRepository
	users    repository.UserRepository
}

// lock locks the project until the end of the transaction and finds userID's membership. A non-member or
// a missing project: ENTITY_NOT_FOUND, the project's existence is not revealed (ADR-0018).
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

// currentUser returns the signed-in user. If the user was deleted but the access token is still alive,
// the session is invalid: 401, not 404.
func (a *access) currentUser(ctx context.Context, userID string) (*entity.UserAccount, error) {
	user, err := a.users.GetByID(ctx, entity.UserID(userID))
	if domain.HasCode(err, domain.EntityNotFound) {
		return nil, domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
	}
	return user, err
}
