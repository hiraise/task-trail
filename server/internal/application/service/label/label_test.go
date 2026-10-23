package label_test

import (
	"context"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/label"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	userID    = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	projectID = entity.ProjectID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
	labelID   = entity.LabelID("7e6d5c4b-3a29-4817-a6f5-e4d3c2b1a098")
)

var now = time.Date(2026, 10, 23, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx       *mocks.MockTxManager
	projects *mocks.MockProjectRepository
	members  *mocks.MockProjectMemberRepository
	labels   *mocks.MockLabelRepository
}

func newModule(t *testing.T) (*label.LabelModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:       mocks.NewMockTxManager(ctrl),
		projects: mocks.NewMockProjectRepository(ctrl),
		members:  mocks.NewMockProjectMemberRepository(ctrl),
		labels:   mocks.NewMockLabelRepository(ctrl),
	}
	clk := clock.New(now)
	return label.New(label.Deps{
		TxManager:    d.tx,
		Clock:        clk,
		ProjectRepo:  d.projects,
		MemberRepo:   d.members,
		LabelRepo:    d.labels,
		LabelFactory: factory.NewLabelFactory(id.New(), clk),
	}), d
}

// expectLock expects the project lock and the membership of userID with role.
func (d *deps) expectLock(archived bool, role entity.ProjectRole) {
	project := &entity.Project{ID: projectID}
	if archived {
		at := now.Add(-time.Hour)
		project.ArchivedAt = &at
	}
	d.projects.EXPECT().GetForUpdate(txtest.InTx, projectID).Return(project, nil)
	d.members.EXPECT().Get(txtest.InTx, projectID, userID).
		Return(&entity.ProjectMember{ProjectID: projectID, UserID: userID, Role: role}, nil)
}

func stored() *entity.Label {
	return &entity.Label{ID: labelID, ProjectID: projectID, Name: "Баг", Color: entity.LabelRed,
		CreatedAt: now.Add(-time.Hour), UpdatedAt: now.Add(-time.Hour)}
}

// Any member creates a label of the project.
func TestCreateLabel(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	d.expectLock(false, entity.RoleMember)
	d.labels.EXPECT().Create(txtest.InTx, gomock.Any()).Return(nil)
	got, err := module.Create.Execute(context.Background(), string(userID), string(projectID),
		dto.LabelData{Name: "Баг", Color: entity.LabelRed})
	if err != nil {
		t.Fatal(err)
	}
	if got.ProjectID != projectID || got.Name != "Баг" || got.Color != entity.LabelRed || !got.CreatedAt.Equal(now) || got.ID == "" {
		t.Fatalf("label %+v", got)
	}
}

// The owner or an admin changes only the given fields.
func TestUpdateLabel(t *testing.T) {
	module, d := newModule(t)
	txtest.Expect(d.tx)
	d.expectLock(false, entity.RoleAdmin)
	d.labels.EXPECT().Get(txtest.InTx, projectID, labelID).Return(stored(), nil)
	d.labels.EXPECT().Update(txtest.InTx, gomock.Any()).Return(nil)
	color := entity.LabelGreen
	got, err := module.Update.Execute(context.Background(), string(userID), string(projectID), string(labelID),
		dto.LabelChanges{Color: &color})
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "Баг" || got.Color != entity.LabelGreen || !got.UpdatedAt.Equal(now) {
		t.Fatalf("label %+v", got)
	}
}

// A member does not manage labels; an archived project changes nothing; another project's label is not found.
func TestLabelChangeRefused(t *testing.T) {
	name := "Ошибка"
	ctx := context.Background()
	for title, c := range map[string]struct {
		archived bool
		role     entity.ProjectRole
		expect   func(d *deps)
		run      func(m *label.LabelModule) error
		code     domain.ErrorCode
	}{
		"a member updates": {role: entity.RoleMember, code: domain.Forbidden, run: func(m *label.LabelModule) error {
			_, err := m.Update.Execute(ctx, string(userID), string(projectID), string(labelID), dto.LabelChanges{Name: &name})
			return err
		}},
		"a member deletes": {role: entity.RoleMember, code: domain.Forbidden, run: func(m *label.LabelModule) error {
			return m.Delete.Execute(ctx, string(userID), string(projectID), string(labelID))
		}},
		"create in an archived project": {archived: true, role: entity.RoleOwner, code: domain.ProjectArchived, run: func(m *label.LabelModule) error {
			_, err := m.Create.Execute(ctx, string(userID), string(projectID), dto.LabelData{Name: name, Color: entity.LabelGray})
			return err
		}},
		"delete in an archived project": {archived: true, role: entity.RoleOwner, code: domain.ProjectArchived, run: func(m *label.LabelModule) error {
			return m.Delete.Execute(ctx, string(userID), string(projectID), string(labelID))
		}},
		"delete a label of another project": {role: entity.RoleOwner, code: domain.EntityNotFound,
			expect: func(d *deps) {
				d.labels.EXPECT().Get(txtest.InTx, projectID, labelID).Return(nil, domain.ErrEntityNotFound(0, nil))
			},
			run: func(m *label.LabelModule) error {
				return m.Delete.Execute(ctx, string(userID), string(projectID), string(labelID))
			}},
	} {
		t.Run(title, func(t *testing.T) {
			module, d := newModule(t)
			txtest.Expect(d.tx)
			d.expectLock(c.archived, c.role)
			if c.expect != nil {
				c.expect(d)
			}
			if err := c.run(module); !domain.HasCode(err, c.code) {
				t.Fatalf("err = %v, want %s", err, c.code)
			}
		})
	}
}

// A non-member does not see the labels of a project.
func TestListLabelsNonMember(t *testing.T) {
	module, d := newModule(t)
	d.members.EXPECT().Get(txtest.OutsideTx, projectID, userID).Return(nil, domain.ErrEntityNotFound(0, nil))
	if _, err := module.List.Execute(context.Background(), string(userID), string(projectID)); !domain.HasCode(err, domain.EntityNotFound) {
		t.Fatalf("err = %v", err)
	}
}
