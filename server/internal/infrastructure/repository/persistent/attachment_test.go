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

var _ repository.AttachmentRepository = (*persistent.PGAttachmentRepository)(nil)

// Attachments of a task: newest first, only of this task, a soft-deleted file disappears (ADR-0037).
func TestAttachmentRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewAttachmentRepo(pool)
	files := persistent.NewFileRepo(pool)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	project := createProject(t, pool, "Дизайн-система")
	task := entity.TaskID(insertTask(t, pool, project, anna, nil))
	other := entity.TaskID(insertTask(t, pool, project, anna, nil))

	attach := func(name string, size int64, at time.Time) *entity.Attachment {
		t.Helper()
		f := factory.NewFileFactory(id.New(), clock.New(at)).New(name, "text/plain; charset=utf-8", anna.ID, size)
		if err := files.Create(ctx, f); err != nil {
			t.Fatal(err)
		}
		a := &entity.Attachment{TaskID: task, File: f, CreatedAt: f.CreatedAt}
		if err := repo.Create(ctx, a); err != nil {
			t.Fatal(err)
		}
		return a
	}
	first := attach("notes.txt", 5, now)
	second := attach("plan.txt", 7, now.Add(time.Minute))

	list, err := repo.ListByTask(ctx, task)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 || list[0].File.ID != second.File.ID || list[1].File.ID != first.File.ID {
		t.Fatalf("list %+v", list)
	}
	got := list[1]
	if got.TaskID != task || got.File.OriginalName != "notes.txt" || got.File.Size != 5 || got.File.OwnerID != anna.ID ||
		got.File.MimeType != "text/plain; charset=utf-8" || !got.CreatedAt.Equal(now) || !got.File.CreatedAt.Equal(now) {
		t.Fatalf("read %+v %+v", got, got.File)
	}
	if a, err := repo.Get(ctx, task, first.File.ID); err != nil || a.File.ID != first.File.ID {
		t.Fatalf("get %+v, %v", a, err)
	}
	_, err = repo.Get(ctx, other, first.File.ID)
	requireCode(t, err, domain.EntityNotFound)

	if id, err := repo.TaskOf(ctx, first.File.ID); err != nil || id == nil || *id != task {
		t.Fatalf("task of an attachment %v, %v", id, err)
	}
	avatar := factory.NewFileFactory(id.New(), clock.New(now)).New("a.png", "image/png", anna.ID, 1)
	if err := files.Create(ctx, avatar); err != nil {
		t.Fatal(err)
	}
	if id, err := repo.TaskOf(ctx, avatar.ID); err != nil || id != nil {
		t.Fatalf("task of an avatar %v, %v", id, err)
	}

	// A file marked deleted is not an attachment any more
	if err := files.SoftDelete(ctx, second.File.ID, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if list, err := repo.ListByTask(ctx, task); err != nil || len(list) != 1 || list[0].File.ID != first.File.ID {
		t.Fatalf("list after soft delete %+v, %v", list, err)
	}
	_, err = repo.Get(ctx, task, second.File.ID)
	requireCode(t, err, domain.EntityNotFound)

	if err := repo.Delete(ctx, first.File.ID); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.Delete(ctx, first.File.ID), domain.EntityNotFound)
	if id, err := repo.TaskOf(ctx, first.File.ID); err != nil || id != nil {
		t.Fatalf("task of a deleted attachment %v, %v", id, err)
	}
}
