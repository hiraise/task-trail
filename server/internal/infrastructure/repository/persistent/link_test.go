package persistent_test

import (
	"bytes"
	"context"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/infrastructure/service/linktoken"
	"task-trail/test/clock"
	"task-trail/test/projectkey"
	"task-trail/test/testdb"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	_ repository.PasswordResetRepository = (*persistent.PGPasswordResetRepository)(nil)
	_ repository.InvitationRepository    = (*persistent.PGInvitationRepository)(nil)
	_ repository.ProjectMemberRepository = (*persistent.PGProjectMemberRepository)(nil)
)

// createUser creates a user for foreign keys.
func createUser(t *testing.T, pool *pgxpool.Pool, email entity.Email, username string) *entity.UserAccount {
	t.Helper()
	repo, f := userRepo(pool)
	user := f.New(email, "$2a$12$hash", username)
	if err := repo.Create(context.Background(), user); err != nil {
		t.Fatal(err)
	}
	return user
}

// createProject inserts a project directly, without an owner: link and member tests do not need one.
func createProject(t *testing.T, pool *pgxpool.Pool, name string) entity.ProjectID {
	t.Helper()
	projectID := id.New().Generate()
	if _, err := pool.Exec(context.Background(), `INSERT INTO projects (id, name, key) VALUES ($1, $2, $3)`, projectID, name, projectkey.New()); err != nil {
		t.Fatal(err)
	}
	return entity.ProjectID(projectID)
}

func TestPasswordResetRepository(t *testing.T) {
	pool := testdb.New(t)
	repo := persistent.NewPasswordResetRepo(pool)
	f := factory.NewPasswordResetFactory(linktoken.New(), clock.New(now), time.Hour)
	ctx := context.Background()
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	anna := createUser(t, pool, "anna@example.com", "Анна")

	token, reset := f.New(ivan.ID)
	_, second := f.New(ivan.ID)
	_, other := f.New(anna.ID)
	for _, r := range []*entity.PasswordReset{reset, second, other} {
		if err := repo.Create(ctx, r); err != nil {
			t.Fatal(err)
		}
	}

	got, err := repo.GetForUpdate(ctx, entity.HashLinkToken(token))
	if err != nil {
		t.Fatal(err)
	}
	if got.UserID != ivan.ID || !got.ExpiredAt.Equal(now.Add(time.Hour)) || !got.CreatedAt.Equal(now) {
		t.Fatalf("read %+v", got)
	}
	_, err = repo.GetForUpdate(ctx, entity.HashLinkToken("unknown"))
	requireCode(t, err, domain.EntityNotFound)

	// A reset revokes all of the user's links, other users' links stay
	if err := repo.DeleteByUser(ctx, ivan.ID); err != nil {
		t.Fatal(err)
	}
	for _, r := range []*entity.PasswordReset{reset, second} {
		_, err := repo.GetForUpdate(ctx, r.TokenHash)
		requireCode(t, err, domain.EntityNotFound)
	}
	if _, err := repo.GetForUpdate(ctx, other.TokenHash); err != nil {
		t.Fatalf("another user's link: %v", err)
	}

	if deleted, err := repo.DeleteExpired(ctx, now.Add(time.Hour-time.Second)); err != nil || deleted != 0 {
		t.Fatalf("active links deleted: %d, %v", deleted, err)
	}
	if deleted, err := repo.DeleteExpired(ctx, now.Add(time.Hour)); err != nil || deleted != 1 {
		t.Fatalf("expired deleted %d, %v", deleted, err)
	}
}

func TestInvitationRepository(t *testing.T) {
	pool := testdb.New(t)
	repo := persistent.NewInvitationRepo(pool)
	clk := clock.New(now)
	f := factory.NewInvitationFactory(id.New(), linktoken.New(), clk, 7*24*time.Hour)
	ctx := context.Background()
	owner := createUser(t, pool, "owner@example.com", "Анна")
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	deleted := createProject(t, pool, "Удалённый")
	if _, err := pool.Exec(ctx, `UPDATE projects SET deleted_at = $1 WHERE id = $2`, now, deleted); err != nil {
		t.Fatal(err)
	}

	token, invitation := f.New(design, "ivan@example.com", owner.ID)
	_, toBackend := f.New(backend, "ivan@example.com", owner.ID)
	deletedToken, toDeleted := f.New(deleted, "ivan@example.com", owner.ID)
	_, toAnother := f.New(design, "petr@example.com", owner.ID)
	for _, i := range []*entity.Invitation{invitation, toBackend, toDeleted, toAnother} {
		if err := repo.Create(ctx, i); err != nil {
			t.Fatal(err)
		}
	}

	got, err := repo.GetByTokenHash(ctx, entity.HashLinkToken(token))
	if err != nil {
		t.Fatal(err)
	}
	if got.ProjectName != "Дизайн-система" || got.InviterEmail != owner.Email || *got.InviterUsername != "Анна" {
		t.Fatalf("details: %+v", got)
	}
	i := got.Invitation
	if i.ID != invitation.ID || i.ProjectID != design || i.Email != "ivan@example.com" || i.InvitedBy != owner.ID ||
		!bytes.Equal(i.TokenHash, invitation.TokenHash) || !i.ExpiredAt.Equal(invitation.ExpiredAt) || !i.CreatedAt.Equal(now) {
		t.Fatalf("read %+v, written %+v", i, invitation)
	}

	// Invitations of a deleted project are not valid (ADR-0001)
	_, err = repo.GetByTokenHash(ctx, entity.HashLinkToken(deletedToken))
	requireCode(t, err, domain.EntityNotFound)
	list, err := repo.ListByEmail(ctx, "ivan@example.com")
	if err != nil {
		t.Fatal(err)
	}
	projects := map[entity.ProjectID]bool{}
	for _, i := range list {
		projects[i.ProjectID] = true
	}
	if len(list) != 2 || !projects[design] || !projects[backend] {
		t.Fatalf("invitations for the email: %+v", list)
	}

	// A new invitation of the same email to the same project replaces the previous one: the old link is no longer valid
	clk.Advance(time.Hour)
	newToken, renewed := f.New(design, "ivan@example.com", owner.ID)
	if err := repo.Create(ctx, renewed); err != nil {
		t.Fatal(err)
	}
	_, err = repo.GetByTokenHash(ctx, entity.HashLinkToken(token))
	requireCode(t, err, domain.EntityNotFound)
	if got, err := repo.GetByTokenHash(ctx, entity.HashLinkToken(newToken)); err != nil || got.Invitation.ID != renewed.ID ||
		!got.Invitation.ExpiredAt.Equal(renewed.ExpiredAt) {
		t.Fatalf("new invitation: %+v, %v", got, err)
	}

	// The first three invitations expire; the extended one expires an hour later
	if deleted, err := repo.DeleteExpired(ctx, now.Add(7*24*time.Hour)); err != nil || deleted != 3 {
		t.Fatalf("expired deleted %d, %v", deleted, err)
	}
	if list, err := repo.ListByEmail(ctx, "ivan@example.com"); err != nil || len(list) != 1 || list[0].ID != renewed.ID {
		t.Fatalf("after cleanup: %+v, %v", list, err)
	}
}

func TestProjectMemberRepository(t *testing.T) {
	pool := testdb.New(t)
	repo := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	ctx := context.Background()
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	project := createProject(t, pool, "Дизайн-система")

	member := &entity.ProjectMember{ProjectID: project, UserID: ivan.ID, Role: entity.RoleMember, CreatedAt: now, UpdatedAt: now}
	if err := repo.Add(ctx, member); err != nil {
		t.Fatal(err)
	}
	var role string
	if err := pool.QueryRow(ctx, `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`, project, ivan.ID).Scan(&role); err != nil || role != "member" {
		t.Fatalf("role %q, %v", role, err)
	}
	requireCode(t, repo.Add(ctx, member), domain.EntityAlreadyExists)
}
