// Package label holds the use cases of project labels (ADR-0035): any member lists and creates them,
// the owner and admins rename, recolor and delete them. A non-member gets 404, an archived project
// changes nothing (ADR-0027).
package label

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type LabelModule struct {
	List   *ListLabelsService
	Create *CreateLabelService
	Update *UpdateLabelService
	Delete *DeleteLabelService
}

// Deps are the dependencies of the label module.
type Deps struct {
	TxManager    transaction.TxManager
	Clock        service.Clock
	ProjectRepo  repository.ProjectRepository
	MemberRepo   repository.ProjectMemberRepository
	LabelRepo    repository.LabelRepository
	LabelFactory *factory.LabelFactory
}

func New(d Deps) *LabelModule {
	a := &access{projects: d.ProjectRepo, members: d.MemberRepo}
	return &LabelModule{
		List:   &ListLabelsService{members: d.MemberRepo, labels: d.LabelRepo},
		Create: &CreateLabelService{txManager: d.TxManager, access: a, labels: d.LabelRepo, factory: d.LabelFactory},
		Update: &UpdateLabelService{txManager: d.TxManager, clock: d.Clock, access: a, labels: d.LabelRepo},
		Delete: &DeleteLabelService{txManager: d.TxManager, access: a, labels: d.LabelRepo},
	}
}

type access struct {
	projects repository.ProjectRepository
	members  repository.ProjectMemberRepository
}

// lock locks the project until the end of the transaction and returns the user's membership.
// A non-member gets ENTITY_NOT_FOUND before the archive check: they do not learn the project is archived.
func (a *access) lock(ctx context.Context, projectID, userID string) (*entity.ProjectMember, error) {
	project, err := a.projects.GetForUpdate(ctx, entity.ProjectID(projectID))
	if err != nil {
		return nil, err
	}
	member, err := a.members.Get(ctx, project.ID, entity.UserID(userID))
	if err != nil {
		return nil, err
	}
	if err := project.RequireActive(); err != nil {
		return nil, err
	}
	return member, nil
}

// ListLabelsService — labels of a project for any member, archived projects included.
type ListLabelsService struct {
	members repository.ProjectMemberRepository
	labels  repository.LabelRepository
}

func (s *ListLabelsService) Execute(ctx context.Context, userID, projectID string) ([]*entity.Label, error) {
	if _, err := s.members.Get(ctx, entity.ProjectID(projectID), entity.UserID(userID)); err != nil {
		return nil, err
	}
	return s.labels.ListInProject(ctx, entity.ProjectID(projectID))
}

// CreateLabelService — any member of an active project creates a label.
type CreateLabelService struct {
	txManager transaction.TxManager
	access    *access
	labels    repository.LabelRepository
	factory   *factory.LabelFactory
}

func (s *CreateLabelService) Execute(ctx context.Context, userID, projectID string, data dto.LabelData) (*entity.Label, error) {
	var label *entity.Label
	f := func(ctx context.Context) error {
		member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		label = s.factory.New(member.ProjectID, data.Name, data.Color)
		return s.labels.Create(ctx, label)
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return label, nil
}

// UpdateLabelService — the owner or an admin renames or recolors a label.
type UpdateLabelService struct {
	txManager transaction.TxManager
	clock     service.Clock
	access    *access
	labels    repository.LabelRepository
}

func (s *UpdateLabelService) Execute(ctx context.Context, userID, projectID, labelID string, changes dto.LabelChanges) (*entity.Label, error) {
	var label *entity.Label
	f := func(ctx context.Context) error {
		member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.RequireManager(); err != nil {
			return err
		}
		if label, err = s.labels.Get(ctx, member.ProjectID, entity.LabelID(labelID)); err != nil {
			return err
		}
		now := s.clock.Now()
		if changes.Name != nil {
			label.Rename(*changes.Name, now)
		}
		if changes.Color != nil {
			label.Recolor(*changes.Color, now)
		}
		return s.labels.Update(ctx, label)
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return label, nil
}

// DeleteLabelService — the owner or an admin deletes a label at once, with its links to tasks.
type DeleteLabelService struct {
	txManager transaction.TxManager
	access    *access
	labels    repository.LabelRepository
}

func (s *DeleteLabelService) Execute(ctx context.Context, userID, projectID, labelID string) error {
	return s.txManager.DoWithTx(ctx, func(ctx context.Context) error {
		member, err := s.access.lock(ctx, projectID, userID)
		if err != nil {
			return err
		}
		if err := member.RequireManager(); err != nil {
			return err
		}
		label, err := s.labels.Get(ctx, member.ProjectID, entity.LabelID(labelID))
		if err != nil {
			return err
		}
		return s.labels.Delete(ctx, label.ID)
	})
}
