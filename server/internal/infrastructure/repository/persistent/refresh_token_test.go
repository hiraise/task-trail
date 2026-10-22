package persistent_test

import (
	"context"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/testdb"
)

func TestRefreshTokenRepository(t *testing.T) {
	pool := testdb.New(t)
	users, uf := userRepo(pool)
	clk := clock.New(now)
	f := factory.NewRTFactory(id.New(), clk, time.Hour)
	repo := persistent.NewRefreshTokenRepo(pool, f)
	tx := persistent.NewPgTxManager(pool)
	ctx := context.Background()

	ivan, petr := uf.New("ivan@example.com", "hash", "Иван"), uf.New("petr@example.com", "hash", "Пётр")
	for _, u := range []*entity.UserAccount{ivan, petr} {
		if err := users.Create(ctx, u); err != nil {
			t.Fatal(err)
		}
	}
	get := func(token *entity.RefreshToken) *entity.RefreshToken {
		t.Helper()
		var got *entity.RefreshToken
		if err := tx.DoWithTx(ctx, func(ctx context.Context) error {
			var err error
			got, err = repo.GetForUpdate(ctx, token.ID, token.UserID)
			return err
		}); err != nil {
			t.Fatal(err)
		}
		return got
	}
	create := func(userID entity.UserID) *entity.RefreshToken {
		t.Helper()
		token := f.NewToken(userID)
		if err := repo.Create(ctx, token); err != nil {
			t.Fatal(err)
		}
		return token
	}

	rotated := create(ivan.ID)
	if got := get(rotated); !got.ExpiredAt.Equal(now.Add(time.Hour)) || got.RotatedAt != nil || got.RevokedAt != nil {
		t.Fatalf("read %+v", got)
	}
	rotated.Rotate(now)
	if err := repo.Update(ctx, rotated); err != nil {
		t.Fatal(err)
	}
	if got := get(rotated); got.RotatedAt == nil || !got.RotatedAt.Equal(now) {
		t.Fatalf("after exchange: %+v", got)
	}

	// Another user's token is not found
	_, err := repo.GetForUpdate(ctx, rotated.ID, petr.ID)
	requireCode(t, err, domain.EntityNotFound)

	// RevokeAll closes the user's active tokens without touching other users' tokens
	active := create(ivan.ID)
	other := create(petr.ID)
	clk.Advance(time.Minute)
	if err := repo.RevokeAll(ctx, ivan.ID, clk.Now()); err != nil {
		t.Fatal(err)
	}
	for _, token := range []*entity.RefreshToken{rotated, active} {
		if got := get(token); got.RevokedAt == nil || !got.RevokedAt.Equal(clk.Now()) {
			t.Errorf("token %s not revoked: %+v", token.ID, got)
		}
	}
	if got := get(other); got.RevokedAt != nil {
		t.Errorf("another user's token revoked: %+v", got)
	}

	// DeleteExpired deletes tokens expired by now, revoked ones included
	fresh := create(petr.ID)
	deleted, err := repo.DeleteExpired(ctx, now.Add(time.Hour))
	if err != nil || deleted != 3 {
		t.Fatalf("deleted %d, %v; expected 3", deleted, err)
	}
	if got := get(fresh); got == nil {
		t.Fatal("an active token was deleted")
	}
}
