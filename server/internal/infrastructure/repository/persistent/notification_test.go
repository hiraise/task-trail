package persistent_test

import (
	"context"
	"slices"
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/testdb"
)

// A user sees own notifications of live tasks in projects where they are a member, newest first;
// rows of the same time — the later written first (ADR-0038).
func TestNotificationRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewNotificationRepo(pool)
	f := factory.NewNotificationFactory(id.New())
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	for _, p := range []entity.ProjectID{design, backend} {
		if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member')`, p, ivan.ID); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'owner')`, design, anna.ID); err != nil {
		t.Fatal(err)
	}
	task := entity.TaskID(insertTask(t, pool, design, anna, ivan))
	deleted := entity.TaskID(insertTask(t, pool, design, anna, ivan))
	left := entity.TaskID(insertTask(t, pool, backend, anna, ivan))

	write := func(taskID entity.TaskID, kind entity.NotificationKind, at time.Time) *entity.Notification {
		t.Helper()
		n := f.New(ivan.ID, taskID, &anna.ID, kind, at)
		if err := repo.Create(ctx, n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	assigned := write(task, entity.NotifyAssigned, now)
	status := f.New(ivan.ID, task, &anna.ID, entity.NotifyStatusChanged, now)
	from, to := entity.StatusOpen, entity.StatusInProgress
	status.FromStatus, status.ToStatus = &from, &to
	text := "Посмотри макет"
	commented := f.New(ivan.ID, task, &anna.ID, entity.NotifyCommented, now.Add(time.Minute))
	commented.Text = &text
	reminder := f.New(ivan.ID, task, nil, entity.NotifyDueSoon, now.Add(time.Minute))
	dueDate := "2026-10-22"
	reminder.DueDate = &dueDate
	if err := repo.Create(ctx, status, commented, reminder); err != nil {
		t.Fatal(err)
	}
	write(deleted, entity.NotifyAssigned, now.Add(time.Hour))
	write(left, entity.NotifyAssigned, now.Add(time.Hour))
	if err := repo.Create(ctx, f.New(anna.ID, task, &ivan.ID, entity.NotifyCommented, now)); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `UPDATE tasks SET deleted_at = $1 WHERE id = $2`, now, deleted); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, backend, ivan.ID); err != nil {
		t.Fatal(err)
	}

	list, err := repo.ListForUser(ctx, ivan.ID, 100)
	if err != nil {
		t.Fatal(err)
	}
	if got := viewIDs(list); !slices.Equal(got, []entity.NotificationID{reminder.ID, commented.ID, status.ID, assigned.ID}) {
		t.Fatalf("order and visibility: %v", got)
	}
	if limited, err := repo.ListForUser(ctx, ivan.ID, 2); err != nil || len(limited) != 2 || limited[0].Notification.ID != reminder.ID {
		t.Fatalf("limit: %v, %v", viewIDs(limited), err)
	}
	r, c, s := list[0].Notification, list[1].Notification, list[2].Notification
	if r.ActorID != nil || r.DueDate == nil || *r.DueDate != dueDate || r.Text != nil || r.FromStatus != nil {
		t.Fatalf("reminder: %+v", r)
	}
	if c.Text == nil || *c.Text != text || c.ActorID == nil || *c.ActorID != anna.ID || !c.CreatedAt.Equal(now.Add(time.Minute)) {
		t.Fatalf("comment: %+v", c)
	}
	if s.FromStatus == nil || *s.FromStatus != from || *s.ToStatus != to || s.Text != nil {
		t.Fatalf("status: %+v", s)
	}
	if list[0].TaskName != "Задача" || list[0].TaskKey == "" || list[0].TaskKey[len(list[0].TaskKey)-2:] != "-1" {
		t.Fatalf("task: %q %q", list[0].TaskKey, list[0].TaskName)
	}
	requireUnread(t, repo, ivan.ID, 4)

	got, err := repo.Get(ctx, ivan.ID, commented.ID)
	if err != nil || got.Notification.ID != commented.ID {
		t.Fatalf("get: %+v, %v", got, err)
	}
	_, err = repo.Get(ctx, anna.ID, commented.ID)
	requireCode(t, err, domain.EntityNotFound)

	readAt := now.Add(2 * time.Hour)
	if err := repo.SetReadAt(ctx, commented.ID, &readAt); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.Get(ctx, ivan.ID, commented.ID); err != nil || got.Notification.ReadAt == nil || !got.Notification.ReadAt.Equal(readAt) {
		t.Fatalf("read: %+v, %v", got, err)
	}
	requireUnread(t, repo, ivan.ID, 3)
	if err := repo.SetReadAt(ctx, commented.ID, nil); err != nil {
		t.Fatal(err)
	}
	requireUnread(t, repo, ivan.ID, 4)
	requireCode(t, repo.SetReadAt(ctx, entity.NotificationID(id.New().Generate()), nil), domain.EntityNotFound)

	if err := repo.MarkAllRead(ctx, ivan.ID, readAt); err != nil {
		t.Fatal(err)
	}
	requireUnread(t, repo, ivan.ID, 0)
	requireUnread(t, repo, anna.ID, 1)

	deletedCount, err := repo.DeleteOlderThan(ctx, now.Add(time.Minute))
	if err != nil || deletedCount != 3 {
		t.Fatalf("delete older: %d, %v", deletedCount, err)
	}
	if list, err := repo.ListForUser(ctx, ivan.ID, 100); err != nil || !slices.Equal(viewIDs(list), []entity.NotificationID{reminder.ID, commented.ID}) {
		t.Fatalf("after delete: %v, %v", viewIDs(list), err)
	}
}

func viewIDs(views []*repository.NotificationView) []entity.NotificationID {
	var ids []entity.NotificationID
	for _, v := range views {
		ids = append(ids, v.Notification.ID)
	}
	return ids
}

func requireUnread(t *testing.T, repo *persistent.PGNotificationRepository, userID entity.UserID, want int) {
	t.Helper()
	if count, err := repo.CountUnread(context.Background(), userID); err != nil || count != want {
		t.Fatalf("unread of %s: %d, %v; want %d", userID, count, err, want)
	}
}
