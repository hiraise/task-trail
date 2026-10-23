package persistent_test

import (
	"context"
	"reflect"
	"slices"
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

// Comments are written, edited and erased; lists are newest first, rows with the same time —
// the later written first (ADR-0028).
func TestCommentRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewCommentRepo(pool)
	clk := clock.New(now)
	f := factory.NewCommentFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	design := createProject(t, pool, "Дизайн-система")
	task := entity.TaskID(insertTask(t, pool, design, anna, nil))
	other := entity.TaskID(insertTask(t, pool, design, anna, nil))

	write := func(taskID entity.TaskID, text string) *entity.Comment {
		t.Helper()
		c := f.New(taskID, anna.ID, text)
		if err := repo.Create(ctx, c); err != nil {
			t.Fatal(err)
		}
		return c
	}
	first := write(task, "Первый")
	second := write(task, "Второй")
	write(other, "Чужой")
	clk.Advance(time.Minute)
	third := write(task, "Третий")

	if err := third.Edit(anna.ID, "Третий, исправлен", clk.Now()); err != nil {
		t.Fatal(err)
	}
	if err := repo.Update(ctx, third); err != nil {
		t.Fatal(err)
	}
	got, err := repo.Get(ctx, third.ID)
	if err != nil || got.Text != "Третий, исправлен" || got.EditedAt == nil || !got.EditedAt.Equal(clk.Now()) ||
		got.TaskID != task || got.AuthorID != anna.ID || !got.CreatedAt.Equal(third.CreatedAt) {
		t.Fatalf("edited: %+v, %v", got, err)
	}

	list, err := repo.ListByTask(ctx, task)
	if err != nil {
		t.Fatal(err)
	}
	var ids []entity.CommentID
	for _, c := range list {
		ids = append(ids, c.ID)
	}
	if !slices.Equal(ids, []entity.CommentID{third.ID, second.ID, first.ID}) {
		t.Fatalf("order: %v", ids)
	}

	if err := repo.Delete(ctx, second.ID); err != nil {
		t.Fatal(err)
	}
	_, err = repo.Get(ctx, second.ID)
	requireCode(t, err, domain.EntityNotFound)
	requireCode(t, repo.Delete(ctx, second.ID), domain.EntityNotFound)
	requireCode(t, repo.Update(ctx, second), domain.EntityNotFound)
}

// Events keep the change fields their kind sets, and only those.
func TestTaskEventRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewTaskEventRepo(pool)
	f := factory.NewTaskEventFactory(id.New())
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	design := createProject(t, pool, "Дизайн-система")
	task := entity.TaskID(insertTask(t, pool, design, anna, nil))

	later := now.Add(time.Minute)
	written := []*entity.TaskEvent{
		f.New(task, anna.ID, entity.EventCreated, now),
		f.StatusChanged(task, anna.ID, entity.StatusOpen, entity.StatusDone, later),
		f.AssigneeChanged(task, anna.ID, nil, &ivan.ID, later),
		f.Moved(task, anna.ID, "DS-1", "BE-4", later),
		f.AssigneeChanged(task, anna.ID, &ivan.ID, nil, later),
	}
	for _, e := range written {
		if err := repo.Create(ctx, e); err != nil {
			t.Fatal(err)
		}
	}
	got, err := repo.ListByTask(ctx, task)
	if err != nil {
		t.Fatal(err)
	}
	want := slices.Clone(written)
	slices.Reverse(want)
	if len(got) != len(want) {
		t.Fatalf("events: %d", len(got))
	}
	for i := range want {
		g := *got[i]
		g.CreatedAt = g.CreatedAt.UTC()
		if !reflect.DeepEqual(&g, want[i]) {
			t.Errorf("event %d: %+v, want %+v", i, g, *want[i])
		}
	}
	var data string
	if err := pool.QueryRow(ctx, `SELECT data::text FROM task_events WHERE id = $1`, written[2].ID).Scan(&data); err != nil ||
		data != `{"toUser": "`+string(ivan.ID)+`"}` {
		t.Fatalf("stored data: %s, %v", data, err)
	}
}

// ListByIDs reads users in one query and skips missing IDs.
func TestUserListByIDs(t *testing.T) {
	pool := testdb.New(t)
	repo, _ := userRepo(pool)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	createUser(t, pool, "petr@example.com", "Пётр")
	users, err := repo.ListByIDs(context.Background(), []entity.UserID{ivan.ID, anna.ID, ivan.ID, entity.UserID(id.New().Generate())})
	if err != nil {
		t.Fatal(err)
	}
	var emails []string
	for _, u := range users {
		emails = append(emails, string(u.Email))
	}
	slices.Sort(emails)
	if !slices.Equal(emails, []string{"anna@example.com", "ivan@example.com"}) {
		t.Fatalf("users: %v", emails)
	}
	if users, err := repo.ListByIDs(context.Background(), nil); err != nil || len(users) != 0 {
		t.Fatalf("no IDs: %v, %v", users, err)
	}
}
