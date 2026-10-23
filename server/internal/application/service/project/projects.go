package project

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// ListProjectsService returns the projects where the user is a member.
type ListProjectsService struct {
	projects repository.ProjectRepository
}

func (s *ListProjectsService) Execute(ctx context.Context, userID string) ([]*repository.ProjectView, error) {
	return s.projects.ListViews(ctx, entity.UserID(userID))
}

// GetProjectService returns a project and the user's role in it; a non-member gets ENTITY_NOT_FOUND.
type GetProjectService struct {
	projects repository.ProjectRepository
}

func (s *GetProjectService) Execute(ctx context.Context, userID, projectID string) (*repository.ProjectView, error) {
	return s.projects.GetView(ctx, entity.ProjectID(projectID), entity.UserID(userID))
}

// CreateProjectService creates a project: the creator is the owner, emails from the request are invited
// as in AddMembersService.
type CreateProjectService struct {
	txManager transaction.TxManager
	access    *access
	projects  repository.ProjectRepository
	factory   *factory.ProjectFactory
	members   repository.ProjectMemberRepository
	inviter   *inviter
}

func (s *CreateProjectService) Execute(ctx context.Context, userID string, data dto.CreateProject) (dto.ProjectCreated, error) {
	creator, err := s.access.currentUser(ctx, userID)
	if err != nil {
		return dto.ProjectCreated{}, err
	}
	var env invitationEnv
	if len(data.Emails) > 0 {
		if env, err = s.inviter.env(ctx); err != nil {
			return dto.ProjectCreated{}, err
		}
	}
	project, owner := s.factory.New(data.Name, data.Description, entity.ProjectKey(data.Key), creator.ID)
	var invitations []*invitation
	f := func(ctx context.Context) error {
		if err := s.projects.Create(ctx, project); err != nil {
			return err
		}
		if err := s.members.Add(ctx, owner); err != nil {
			return err
		}
		var err error
		invitations, err = s.inviter.invite(ctx, env, project, creator, data.Emails)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.ProjectCreated{}, err
	}
	s.inviter.send(ctx, env, invitations)
	return dto.ProjectCreated{
		Project:     &repository.ProjectView{Project: project, Role: owner.Role},
		Invitations: results(invitations),
	}, nil
}

// UpdateProjectService changes the name and description: the owner or an administrator;
// the key — only the owner (ADR-0026).
type UpdateProjectService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	projects  repository.ProjectRepository
}

func (s *UpdateProjectService) Execute(ctx context.Context, userID, projectID string, changes dto.ProjectChanges) (*repository.ProjectView, error) {
	var view *repository.ProjectView
	f := func(ctx context.Context) error {
		project, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.RequireManager(); err != nil {
			return err
		}
		if changes.Key != nil {
			if err := member.RequireOwner(); err != nil {
				return err
			}
		}
		now := s.clock.Now()
		if changes.Name != nil {
			project.Rename(*changes.Name, now)
		}
		if changes.DescriptionSet {
			project.Describe(changes.Description, now)
		}
		if changes.Key != nil {
			project.ChangeKey(entity.ProjectKey(*changes.Key), now)
		}
		if err := s.projects.Update(ctx, project); err != nil {
			return err
		}
		view, err = s.projects.GetView(ctx, project.ID, member.UserID)
		return err
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return view, nil
}

// DeleteProjectService soft-deletes a project along with its tasks (ADR-0001): only the owner.
type DeleteProjectService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	projects  repository.ProjectRepository
}

func (s *DeleteProjectService) Execute(ctx context.Context, userID, projectID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		project, member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.RequireOwner(); err != nil {
			return err
		}
		return s.projects.SoftDelete(ctx, project.ID, s.clock.Now())
	})
}

// CandidatesService returns whom the user can invite to a project: people from their projects.
// With projectID: without that project's members, and the user must be allowed to invite to it.
type CandidatesService struct {
	members repository.ProjectMemberRepository
	users   repository.UserRepository
}

func (s *CandidatesService) Execute(ctx context.Context, userID string, projectID *string) ([]*entity.UserAccount, error) {
	var exclude *entity.ProjectID
	if projectID != nil {
		member, err := s.members.Get(ctx, entity.ProjectID(*projectID), entity.UserID(userID))
		if err != nil {
			return nil, err
		}
		if err := member.RequireManager(); err != nil {
			return nil, err
		}
		exclude = &member.ProjectID
	}
	return s.users.ListCandidates(ctx, entity.UserID(userID), exclude)
}
