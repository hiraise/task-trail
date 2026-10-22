package project_test

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/service/project"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/service"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/linktoken"
	"task-trail/test/clock"
	"task-trail/test/mocks"
	"task-trail/test/txtest"

	"go.uber.org/mock/gomock"
)

const (
	ownerID    = entity.UserID("0c5c37ac-3ef6-4b2d-9e2b-547f1fd2378c")
	annaID     = entity.UserID("9d8c7b6a-5e4f-4d3c-8b2a-1f0e9d8c7b6a")
	projectID  = entity.ProjectID("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
	serviceURL = "https://example.com/tasktrail"
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

type deps struct {
	tx          *mocks.MockTxManager
	projects    *mocks.MockProjectRepository
	members     *mocks.MockProjectMemberRepository
	users       *mocks.MockUserRepository
	tasks       *mocks.MockTaskRepository
	invitations *mocks.MockInvitationRepository
	settings    *mocks.MockSettingsRepository
	mailer      *mocks.MockMailer
}

func newModule(t *testing.T) (*project.ProjectModule, *deps) {
	ctrl := gomock.NewController(t)
	d := &deps{
		tx:          mocks.NewMockTxManager(ctrl),
		projects:    mocks.NewMockProjectRepository(ctrl),
		members:     mocks.NewMockProjectMemberRepository(ctrl),
		users:       mocks.NewMockUserRepository(ctrl),
		tasks:       mocks.NewMockTaskRepository(ctrl),
		invitations: mocks.NewMockInvitationRepository(ctrl),
		settings:    mocks.NewMockSettingsRepository(ctrl),
		mailer:      mocks.NewMockMailer(ctrl),
	}
	clk := clock.New(now)
	return project.New(project.Deps{
		TxManager:         d.tx,
		Clock:             clk,
		ProjectRepo:       d.projects,
		ProjectFactory:    factory.NewProjectFactory(id.New(), clk),
		MemberRepo:        d.members,
		UserRepo:          d.users,
		TaskRepo:          d.tasks,
		InvitationRepo:    d.invitations,
		InvitationFactory: factory.NewInvitationFactory(id.New(), linktoken.New(), clk, 7*24*time.Hour),
		SettingsRepo:      d.settings,
		Mailer:            d.mailer,
	}), d
}

func owner() *entity.UserAccount {
	name := "Владелец"
	return &entity.UserAccount{ID: ownerID, Email: "owner@example.com", Username: &name}
}

func notFound() error { return domain.ErrEntityNotFound(0, nil) }

// expectLocked: the project is locked in the transaction, and requester has role in it.
func (d *deps) expectLocked(role entity.ProjectRole) {
	txtest.Expect(d.tx)
	d.projects.EXPECT().GetForUpdate(txtest.InTx, projectID).Return(&entity.Project{ID: projectID, Name: "Дизайн-система"}, nil)
	d.members.EXPECT().Get(txtest.InTx, projectID, ownerID).Return(&entity.ProjectMember{ProjectID: projectID, UserID: ownerID, Role: role}, nil)
}

func (d *deps) expectEnv(mail *entity.MailSettings) {
	d.users.EXPECT().GetByID(gomock.Any(), ownerID).Return(owner(), nil)
	d.settings.EXPECT().GetMail(txtest.OutsideTx).Return(mail, nil)
	d.settings.EXPECT().GetServiceURL(txtest.OutsideTx).Return(serviceURL, nil)
}

// The result is per email in request order, a repeat gets the same result; invitations
// and memberships are written in the transaction. Without mail, the invitation link is in the response (ADR-0017).
func TestAddMembersWithoutMail(t *testing.T) {
	module, d := newModule(t)
	d.expectEnv(nil)
	d.expectLocked(entity.RoleAdmin)
	anna := &entity.UserAccount{ID: annaID, Email: "anna@example.com"}
	d.users.EXPECT().GetByEmail(txtest.InTx, entity.Email("anna@example.com")).Return(anna, nil)
	d.members.EXPECT().Get(txtest.InTx, projectID, annaID).Return(nil, notFound())
	d.members.EXPECT().Add(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, m *entity.ProjectMember) error {
		if *m != *entity.NewMember(projectID, annaID, now) {
			t.Errorf("membership: %+v", m)
		}
		return nil
	})
	d.users.EXPECT().GetByEmail(txtest.InTx, entity.Email("ivan@example.com")).Return(nil, notFound())
	d.invitations.EXPECT().Create(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, i *entity.Invitation) error {
		if i.ProjectID != projectID || i.Email != "ivan@example.com" || i.InvitedBy != ownerID || !i.ExpiredAt.Equal(now.Add(7*24*time.Hour)) {
			t.Errorf("invitation: %+v", i)
		}
		return nil
	})
	d.users.EXPECT().GetByEmail(txtest.InTx, entity.Email("owner@example.com")).Return(owner(), nil)
	d.members.EXPECT().Get(txtest.InTx, projectID, ownerID).Return(&entity.ProjectMember{Role: entity.RoleAdmin}, nil)

	got, err := module.AddMembers.Execute(context.Background(), string(ownerID), string(projectID),
		[]string{"Anna@Example.com", "ivan@example.com", " IVAN@example.com", "owner@example.com"})
	if err != nil {
		t.Fatal(err)
	}
	var outcomes []string
	for _, r := range got {
		outcomes = append(outcomes, string(r.Email)+" "+string(r.Outcome))
	}
	if strings.Join(outcomes, ", ") != "anna@example.com added, ivan@example.com invited, ivan@example.com invited, owner@example.com already_member" {
		t.Fatalf("results: %v", outcomes)
	}
	if got[0].InviteURL != nil || got[1].InviteURL == nil || !strings.HasPrefix(*got[1].InviteURL, serviceURL+"/auth/invite?token=") ||
		got[2].InviteURL != got[1].InviteURL || got[3].InviteURL != nil {
		t.Fatalf("links: %+v", got)
	}
}

// With mail, emails are sent after the transaction; a failed invitation is mail_failed, a failed
// notification to an added person still leaves them a member.
func TestAddMembersWithMail(t *testing.T) {
	module, d := newModule(t)
	mail := &entity.MailSettings{Host: "smtp.example.com", Port: 587}
	d.expectEnv(mail)
	d.expectLocked(entity.RoleOwner)
	for _, email := range []entity.Email{"ivan@example.com", "bounce@example.com"} {
		d.users.EXPECT().GetByEmail(txtest.InTx, email).Return(nil, notFound())
	}
	d.invitations.EXPECT().Create(txtest.InTx, gomock.Any()).Times(2).Return(nil)
	d.users.EXPECT().GetByEmail(txtest.InTx, entity.Email("anna@example.com")).Return(&entity.UserAccount{ID: annaID, Email: "anna@example.com"}, nil)
	d.members.EXPECT().Get(txtest.InTx, projectID, annaID).Return(nil, notFound())
	d.members.EXPECT().Add(txtest.InTx, gomock.Any()).Return(nil)
	var mu sync.Mutex
	letters := map[entity.Email]service.Letter{}
	d.mailer.EXPECT().Send(txtest.OutsideTx, mail, gomock.Any()).Times(3).DoAndReturn(func(ctx context.Context, _ *entity.MailSettings, l service.Letter) error {
		if deadline, ok := ctx.Deadline(); !ok || time.Until(deadline) > 10*time.Second {
			t.Errorf("email without a 10-second deadline: %v", deadline)
		}
		mu.Lock()
		letters[l.To] = l
		mu.Unlock()
		if l.To != "ivan@example.com" {
			return domain.ErrMailSendFailed(errors.New("550"))
		}
		return nil
	})

	got, err := module.AddMembers.Execute(context.Background(), string(ownerID), string(projectID),
		[]string{"ivan@example.com", "bounce@example.com", "anna@example.com"})
	if err != nil {
		t.Fatal(err)
	}
	want := []dto.InvitationResult{
		{Email: "ivan@example.com", Outcome: dto.InvitationInvited},
		{Email: "bounce@example.com", Outcome: dto.InvitationMailFailed},
		{Email: "anna@example.com", Outcome: dto.InvitationAdded},
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("results: %+v", got)
		}
	}
	if l := letters["ivan@example.com"]; !strings.Contains(l.Text, "Владелец приглашает вас в проект «Дизайн-система»") ||
		!strings.Contains(l.Text, serviceURL+"/auth/invite?token=") {
		t.Errorf("invitation:\n%s", l.Text)
	}
	if l := letters["anna@example.com"]; !strings.Contains(l.Text, serviceURL+"/projects/"+string(projectID)) {
		t.Errorf("notification:\n%s", l.Text)
	}
}

// A member gets 403 before looking up whom to remove; they cannot invite either.
func TestMemberCannotManage(t *testing.T) {
	module, d := newModule(t)
	d.expectLocked(entity.RoleMember)
	err := module.RemoveMember.Execute(context.Background(), string(ownerID), string(projectID), string(annaID))
	if !domain.HasCode(err, domain.Forbidden) {
		t.Fatalf("removal: %v", err)
	}
	d.expectEnv(nil)
	d.expectLocked(entity.RoleMember)
	_, err = module.AddMembers.Execute(context.Background(), string(ownerID), string(projectID), []string{"ivan@example.com"})
	if !domain.HasCode(err, domain.Forbidden) {
		t.Fatalf("invitation: %v", err)
	}
}

// Leaving and removal unassign the person from the project's tasks in the same transaction.
func TestLeave(t *testing.T) {
	module, d := newModule(t)
	d.expectLocked(entity.RoleMember)
	d.members.EXPECT().Remove(txtest.InTx, projectID, ownerID).Return(nil)
	d.tasks.EXPECT().UnassignInProject(txtest.InTx, projectID, ownerID, now).Return(nil)
	if err := module.Leave.Execute(context.Background(), string(ownerID), string(projectID)); err != nil {
		t.Fatal(err)
	}

	d.expectLocked(entity.RoleOwner)
	err := module.Leave.Execute(context.Background(), string(ownerID), string(projectID))
	if !domain.HasCode(err, domain.OwnerCannotLeave) {
		t.Fatalf("owner: %v", err)
	}
}

// A project without emails is created without reading mail settings; the creator is the owner.
func TestCreateProject(t *testing.T) {
	module, d := newModule(t)
	d.users.EXPECT().GetByID(gomock.Any(), ownerID).Return(owner(), nil)
	txtest.Expect(d.tx)
	var created *entity.Project
	d.projects.EXPECT().Create(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, p *entity.Project) error {
		created = p
		return nil
	})
	d.members.EXPECT().Add(txtest.InTx, gomock.Any()).DoAndReturn(func(_ context.Context, m *entity.ProjectMember) error {
		if m.ProjectID != created.ID || m.UserID != ownerID || m.Role != entity.RoleOwner {
			t.Errorf("owner: %+v", m)
		}
		return nil
	})
	got, err := module.Create.Execute(context.Background(), string(ownerID), dto.CreateProject{Name: "Дизайн-система"})
	if err != nil {
		t.Fatal(err)
	}
	if got.Project.Project != created || got.Project.Role != entity.RoleOwner || got.Invitations == nil || len(got.Invitations) != 0 ||
		!created.CreatedAt.Equal(now) {
		t.Fatalf("created: %+v", got)
	}
}
