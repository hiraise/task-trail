package persistent_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"task-trail/internal/domain"
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
		t.Fatalf("ожидалась ошибка %s, получено %v", code, err)
	}
}

func TestUserRepository(t *testing.T) {
	repo, f := userRepo(testdb.New(t))
	ctx := context.Background()

	if exists, err := repo.Any(ctx); err != nil || exists {
		t.Fatalf("пустая база: %v, %v", exists, err)
	}
	user := f.New("ivan@example.com", "$2a$12$hash", "Иван")
	user.IsAdmin = true
	if err := repo.Create(ctx, user); err != nil {
		t.Fatal(err)
	}
	if exists, err := repo.Any(ctx); err != nil || !exists {
		t.Fatalf("после создания: %v, %v", exists, err)
	}

	got, err := repo.GetByEmail(ctx, "ivan@example.com")
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != user.ID || got.PasswordHash != user.PasswordHash || *got.Username != "Иван" || !got.IsAdmin ||
		got.AvatarID != nil || got.VerifiedAt == nil || !got.VerifiedAt.Equal(now) || !got.CreatedAt.Equal(now) {
		t.Fatalf("прочитано %+v, записано %+v", got, user)
	}

	got.PasswordHash = "$2a$12$new"
	got.UpdatedAt = now.Add(time.Hour)
	if err := repo.Update(ctx, got); err != nil {
		t.Fatal(err)
	}
	if byID, err := repo.GetByID(ctx, user.ID); err != nil || byID.PasswordHash != "$2a$12$new" || !byID.UpdatedAt.Equal(now.Add(time.Hour)) {
		t.Fatalf("после изменения: %+v, %v", byID, err)
	}

	requireCode(t, repo.Create(ctx, f.New("ivan@example.com", "$2a$12$hash", "Двойник")), domain.EntityAlreadyExists)
	_, err = repo.GetByEmail(ctx, "nobody@example.com")
	requireCode(t, err, domain.EntityNotFound)
}

// Блокировка регистрации держится до конца транзакции: вторая регистрация ждёт первую
// и видит созданный ею аккаунт (ADR-0016).
func TestLockRegistration(t *testing.T) {
	pool := testdb.New(t)
	repo, _ := userRepo(pool)
	tx := persistent.NewPgTxManager(pool)
	ctx := context.Background()

	requireCode(t, repo.LockRegistration(ctx), domain.RepoInternal)

	locked := make(chan struct{})
	release := make(chan struct{})
	first := make(chan error, 1)
	go func() {
		first <- tx.DoWithTx(ctx, func(ctx context.Context) error {
			if err := repo.LockRegistration(ctx); err != nil {
				return err
			}
			close(locked)
			<-release
			return nil
		})
	}()
	<-locked

	second := make(chan error, 1)
	go func() {
		second <- tx.DoWithTx(ctx, func(ctx context.Context) error { return repo.LockRegistration(ctx) })
	}()
	select {
	case err := <-second:
		t.Fatalf("вторая транзакция не ждала блокировку: %v", err)
	case <-time.After(200 * time.Millisecond):
	}
	close(release)
	if err := <-first; err != nil {
		t.Fatal(err)
	}
	if err := <-second; err != nil {
		t.Fatal(err)
	}
}
