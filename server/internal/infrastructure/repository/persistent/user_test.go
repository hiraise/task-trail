package persistent_test

import (
	"context"
	"errors"
	"slices"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/testdb"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	_ repository.UserRepository         = (*persistent.PGUserRepository)(nil)
	_ repository.RefreshTokenRepository = (*persistent.PGRefreshTokenRepository)(nil)
)

var now = time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)

func userRepo(pool *pgxpool.Pool) (*persistent.PGUserRepository, *factory.UserFactory) {
	f := factory.NewUserFactory(id.New(), clock.New(now))
	return persistent.NewUserRepo(pool, f), f
}

func requireCode(t *testing.T, err error, code domain.ErrorCode) {
	t.Helper()
	var e *domain.DomainError
	if !errors.As(err, &e) || e.Code != code {
		t.Fatalf("expected error %s, got %v", code, err)
	}
}

func TestUserRepository(t *testing.T) {
	repo, f := userRepo(testdb.New(t))
	ctx := context.Background()

	if exists, err := repo.Any(ctx); err != nil || exists {
		t.Fatalf("empty database: %v, %v", exists, err)
	}
	user := f.New("ivan@example.com", "$2a$12$hash", "Иван")
	user.IsAdmin = true
	if err := repo.Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	if exists, err := repo.Any(ctx); err != nil || !exists {
		t.Fatalf("after create: %v, %v", exists, err)
	}

	got, err := repo.GetByEmail(ctx, "ivan@example.com")
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != user.ID || got.PasswordHash != user.PasswordHash || *got.Username != "Иван" || !got.IsAdmin ||
		got.AvatarID != nil || got.VerifiedAt == nil || !got.VerifiedAt.Equal(now) || !got.CreatedAt.Equal(now) {
		t.Fatalf("read %+v, written %+v", got, user)
	}

	got.PasswordHash = "$2a$12$new"
	got.UpdatedAt = now.Add(time.Hour)
	if err := repo.Update(ctx, got); err != nil {
		t.Fatal(err)
	}
	if byID, err := repo.GetByID(ctx, user.ID); err != nil || byID.PasswordHash != "$2a$12$new" || !byID.UpdatedAt.Equal(now.Add(time.Hour)) {
		t.Fatalf("after update: %+v, %v", byID, err)
	}

	requireCode(t, repo.Create(ctx, f.New("ivan@example.com", "$2a$12$hash", "Двойник")), domain.EntityAlreadyExists)
	_, err = repo.GetByEmail(ctx, "nobody@example.com")
	requireCode(t, err, domain.EntityNotFound)
}

// The registration (ADR-0016) and admins (ADR-0014) locks are held until the end of the transaction:
// a second transaction with the same lock waits for the first one, with a different lock it does not.
func TestAdvisoryLocks(t *testing.T) {
	pool := testdb.New(t)
	repo, _ := userRepo(pool)
	tx := persistent.NewPgTxManager(pool)
	ctx := context.Background()
	locks := map[string]func(context.Context) error{
		"registration": repo.LockRegistration,
		"admins":       repo.LockAdmins,
	}
	for name, lock := range locks {
		t.Run(name, func(t *testing.T) {
			requireCode(t, lock(ctx), domain.RepoInternal)

			locked := make(chan struct{})
			release := make(chan struct{})
			first := make(chan error, 1)
			go func() {
				first <- tx.DoWithTx(ctx, func(ctx context.Context) error {
					if err := lock(ctx); err != nil {
						return err
					}
					close(locked)
					<-release
					return nil
				})
			}()
			<-locked

			// A different lock does not wait
			for other, otherLock := range locks {
				if other != name {
					if err := tx.DoWithTx(ctx, otherLock); err != nil {
						t.Fatal(err)
					}
				}
			}
			second := make(chan error, 1)
			go func() { second <- tx.DoWithTx(ctx, lock) }()
			select {
			case err := <-second:
				t.Fatalf("the second transaction did not wait for the lock: %v", err)
			case <-time.After(200 * time.Millisecond):
			}
			close(release)
			if err := <-first; err != nil {
				t.Fatal(err)
			}
			if err := <-second; err != nil {
				t.Fatal(err)
			}
		})
	}
}

// The list for the administrator is by registration date, without deleted users; admins are counted
// without deleted users too.
func TestUserListAndAdmins(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	clk := clock.New(now)
	f := factory.NewUserFactory(id.New(), clk)
	repo := persistent.NewUserRepo(pool, f)

	if users, err := repo.List(ctx); err != nil || len(users) != 0 {
		t.Fatalf("empty database: %v, %v", users, err)
	}
	var created []*entity.UserAccount
	for i, email := range []entity.Email{"anna@example.com", "boris@example.com", "vera@example.com", "gleb@example.com"} {
		u := f.New(email, "$2a$12$hash", "")
		u.IsAdmin = i != 1
		if err := repo.Create(ctx, u); err != nil {
			t.Fatal(err)
		}
		created = append(created, u)
		clk.Advance(time.Minute)
	}
	if _, err := pool.Exec(ctx, `UPDATE users SET deleted_at = $1 WHERE id = $2`, now, created[3].ID); err != nil {
		t.Fatal(err)
	}

	users, err := repo.List(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var emails []entity.Email
	for _, u := range users {
		emails = append(emails, u.Email)
	}
	if want := []entity.Email{"anna@example.com", "boris@example.com", "vera@example.com"}; !slices.Equal(emails, want) {
		t.Fatalf("list %v, expected %v", emails, want)
	}
	if !users[0].IsAdmin || users[1].IsAdmin || !users[0].CreatedAt.Equal(now) {
		t.Fatalf("first %+v, second %+v", users[0], users[1])
	}
	if admins, err := repo.CountAdmins(ctx); err != nil || admins != 2 {
		t.Fatalf("admins %d, %v; expected 2", admins, err)
	}
}

// The avatar is read and written together with the user; GetForUpdate holds the row until the end
// of the transaction, and a concurrent update waits instead of overwriting it.
func TestUserAvatarAndLock(t *testing.T) {
	pool := testdb.New(t)
	repo, _ := userRepo(pool)
	files := persistent.NewFileRepo(pool)
	tx := persistent.NewPgTxManager(pool)
	ctx := context.Background()
	user := createUser(t, pool, "ivan@example.com", "Иван")
	avatar := factory.NewFileFactory(id.New(), clock.New(now)).New("a.png", "image/png", user.ID)
	if err := files.Create(ctx, avatar); err != nil {
		t.Fatal(err)
	}

	locked := make(chan struct{})
	release := make(chan struct{})
	first := make(chan error, 1)
	go func() {
		first <- tx.DoWithTx(ctx, func(ctx context.Context) error {
			u, err := repo.GetForUpdate(ctx, user.ID)
			if err != nil {
				return err
			}
			close(locked)
			<-release
			u.ReplaceAvatar(avatar.ID, now)
			return repo.Update(ctx, u)
		})
	}()
	<-locked
	second := make(chan error, 1)
	go func() {
		second <- tx.DoWithTx(ctx, func(ctx context.Context) error {
			u, err := repo.GetForUpdate(ctx, user.ID)
			if err != nil {
				return err
			}
			if u.AvatarID == nil || *u.AvatarID != avatar.ID {
				return errors.New("the second transaction did not see the first one's avatar")
			}
			name := "Иван Петров"
			u.Rename(&name, now)
			return repo.Update(ctx, u)
		})
	}()
	select {
	case err := <-second:
		t.Fatalf("the second transaction did not wait for the lock: %v", err)
	case <-time.After(200 * time.Millisecond):
	}
	close(release)
	if err := <-first; err != nil {
		t.Fatal(err)
	}
	if err := <-second; err != nil {
		t.Fatal(err)
	}
	got, err := repo.GetByID(ctx, user.ID)
	if err != nil || got.AvatarID == nil || *got.AvatarID != avatar.ID || *got.Username != "Иван Петров" {
		t.Fatalf("after both transactions: %+v, %v", got, err)
	}
}

// A user is visible to themselves, to members of shared projects and to members of a project where they authored
// a task — in non-deleted projects and through non-deleted tasks.
func TestUserVisible(t *testing.T) {
	pool := testdb.New(t)
	repo, _ := userRepo(pool)
	ctx := context.Background()
	exec := func(query string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, query, args...); err != nil {
			t.Fatal(err)
		}
	}
	member := func(project entity.ProjectID, user *entity.UserAccount) {
		t.Helper()
		exec(`INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member')`, project, user.ID)
	}
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	petr := createUser(t, pool, "petr@example.com", "Пётр")
	olga := createUser(t, pool, "olga@example.com", "Ольга")
	design := createProject(t, pool, "Дизайн-система")
	member(design, anna)
	member(design, ivan)
	backend := createProject(t, pool, "Бэкенд")
	member(backend, anna)
	// Petr authored a task in the backend but is not a member: he left the project
	exec(`INSERT INTO tasks (id, project_id, number, author_id, name, status) VALUES ($1, $2, 1, $3, 'Задача', 'open')`,
		id.New().Generate(), backend, petr.ID)
	member(createProject(t, pool, "Чужой"), olga)

	visible := func(viewer *entity.UserAccount, want map[*entity.UserAccount]bool) {
		t.Helper()
		for u, ok := range want {
			got, err := repo.GetVisible(ctx, u.ID, viewer.ID)
			if ok && (err != nil || got.ID != u.ID) {
				t.Errorf("%s does not see %s: %v", viewer.Email, u.Email, err)
			}
			if !ok && !domain.HasCode(err, domain.EntityNotFound) {
				t.Errorf("%s sees %s: %v", viewer.Email, u.Email, err)
			}
		}
	}
	visible(anna, map[*entity.UserAccount]bool{anna: true, ivan: true, petr: true, olga: false})
	visible(ivan, map[*entity.UserAccount]bool{ivan: true, anna: true, petr: false, olga: false})
	visible(petr, map[*entity.UserAccount]bool{petr: true, anna: false})

	exec(`UPDATE tasks SET deleted_at = $1`, now)
	exec(`UPDATE projects SET deleted_at = $1 WHERE id = $2`, now, design)
	visible(anna, map[*entity.UserAccount]bool{anna: true, ivan: false, petr: false})
}
