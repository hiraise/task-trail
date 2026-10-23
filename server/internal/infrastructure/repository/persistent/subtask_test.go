package persistent_test

import (
	"context"
	"slices"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/test/testdb"
)

// A parent counts its non-deleted, non-archived subtasks and the resolved ones; ListSubtasks
// includes archived subtasks by number; DetachSubtasks clears the parent (ADR-0036).
func TestSubtasks(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewTaskRepo(pool)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	design := createProject(t, pool, "Дизайн-система")
	get := func(id string) *entity.Task {
		t.Helper()
		task, err := repo.Get(ctx, entity.TaskID(id))
		if err != nil {
			t.Fatal(err)
		}
		return task
	}
	update := func(task *entity.Task) {
		t.Helper()
		if err := repo.Update(ctx, task); err != nil {
			t.Fatal(err)
		}
	}
	later := now.Add(time.Hour)

	parent := get(insertTask(t, pool, design, anna, nil))
	var subtasks []string
	for range 4 {
		sub := get(insertTask(t, pool, design, anna, nil))
		if err := sub.AttachTo(parent, false, later); err != nil {
			t.Fatal(err)
		}
		update(sub)
		subtasks = append(subtasks, string(sub.ID))
	}
	done, archived, deleted := get(subtasks[1]), get(subtasks[2]), subtasks[3]
	done.ChangeStatus(entity.StatusDone, later)
	update(done)
	archived.Archive(later)
	update(archived)
	if err := repo.SoftDelete(ctx, entity.TaskID(deleted), later); err != nil {
		t.Fatal(err)
	}

	if got := get(subtasks[0]); got.ParentID == nil || *got.ParentID != parent.ID || !got.UpdatedAt.Equal(later) {
		t.Fatalf("subtask: %+v", got)
	}
	if got := get(string(parent.ID)); got.SubtasksTotal != 2 || got.SubtasksDone != 1 || got.ParentID != nil {
		t.Fatalf("parent counters: total %d, done %d", got.SubtasksTotal, got.SubtasksDone)
	}
	list, err := repo.ListSubtasks(ctx, parent.ID)
	if err != nil {
		t.Fatal(err)
	}
	var listed []string
	for _, task := range list {
		listed = append(listed, string(task.ID))
	}
	if !slices.Equal(listed, subtasks[:3]) {
		t.Fatalf("subtasks: %v, want %v", listed, subtasks[:3])
	}
	if has, err := repo.HasSubtasks(ctx, parent.ID); err != nil || !has {
		t.Fatalf("has subtasks: %v, %v", has, err)
	}
	if has, err := repo.HasSubtasks(ctx, done.ID); err != nil || has {
		t.Fatalf("a subtask has subtasks: %v, %v", has, err)
	}

	detachedAt := later.Add(time.Hour)
	ids, err := repo.DetachSubtasks(ctx, parent.ID, detachedAt)
	if err != nil {
		t.Fatal(err)
	}
	var detached []string
	for _, id := range ids {
		detached = append(detached, string(id))
	}
	slices.Sort(detached)
	want := slices.Clone(subtasks[:3])
	slices.Sort(want)
	if !slices.Equal(detached, want) {
		t.Fatalf("detached: %v, want %v", detached, want)
	}
	if got := get(subtasks[2]); got.ParentID != nil || !got.UpdatedAt.Equal(detachedAt) {
		t.Fatalf("a detached subtask: %+v", got)
	}
	if got := get(string(parent.ID)); got.SubtasksTotal != 0 {
		t.Fatalf("parent after detaching: total %d", got.SubtasksTotal)
	}
}
