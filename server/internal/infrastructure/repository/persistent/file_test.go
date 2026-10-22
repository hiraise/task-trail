package persistent_test

import (
	"context"
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
)

var _ repository.FileRepository = (*persistent.PGFileRepository)(nil)

// File lifecycle: uploaded → not needed (not served) → erased from disk (ADR-0013).
func TestFileRepository(t *testing.T) {
	pool := testdb.New(t)
	repo := persistent.NewFileRepo(pool)
	f := factory.NewFileFactory(id.New(), clock.New(now))
	ctx := context.Background()
	owner := createUser(t, pool, "ivan@example.com", "Иван")

	avatar := f.New(`C:\fakepath\Фото.png`, "image/png", owner.ID)
	replaced := f.New("old.jpg", "image/jpeg", owner.ID)
	for _, file := range []*entity.File{avatar, replaced} {
		if err := repo.Create(ctx, file); err != nil {
			t.Fatal(err)
		}
	}
	got, err := repo.Get(ctx, avatar.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != avatar.ID || got.OriginalName != "Фото.png" || got.MimeType != "image/png" || got.OwnerID != owner.ID || !got.CreatedAt.Equal(now) {
		t.Fatalf("read %+v", got)
	}
	_, err = repo.Get(ctx, "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e")
	requireCode(t, err, domain.EntityNotFound)

	// An unneeded file is not served but awaits cleanup
	if err := repo.SoftDelete(ctx, replaced.ID, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.SoftDelete(ctx, replaced.ID, now.Add(2*time.Hour)), domain.EntityNotFound)
	_, err = repo.Get(ctx, replaced.ID)
	requireCode(t, err, domain.EntityNotFound)
	if ids, err := repo.ListSoftDeleted(ctx); err != nil || len(ids) != 1 || ids[0] != replaced.ID {
		t.Fatalf("awaiting cleanup: %v, %v", ids, err)
	}

	const orphan = entity.FileID("11111111-2222-4333-8444-555555555555")
	known, err := repo.Known(ctx, []entity.FileID{avatar.ID, replaced.ID, orphan})
	if err != nil || len(known) != 2 || !known[avatar.ID] || !known[replaced.ID] {
		t.Fatalf("known before cleanup: %v, %v", known, err)
	}

	// A file erased from disk no longer awaits cleanup and is not considered known
	if err := repo.MarkErased(ctx, replaced.ID, now.Add(2*time.Hour)); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.MarkErased(ctx, replaced.ID, now.Add(3*time.Hour)), domain.EntityNotFound)
	if ids, err := repo.ListSoftDeleted(ctx); err != nil || len(ids) != 0 {
		t.Fatalf("awaiting cleanup after it: %v, %v", ids, err)
	}
	if known, err := repo.Known(ctx, []entity.FileID{avatar.ID, replaced.ID}); err != nil || len(known) != 1 || !known[avatar.ID] {
		t.Fatalf("known after cleanup: %v, %v", known, err)
	}
	if known, err := repo.Known(ctx, nil); err != nil || len(known) != 0 {
		t.Fatalf("empty list: %v, %v", known, err)
	}
}
