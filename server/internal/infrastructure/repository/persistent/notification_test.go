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
	"task-trail/test/clock"
	"task-trail/test/testdb"
)

// A user sees own notifications of live tasks in projects where they are a member, newest first;
// rows of the same time — the later written first (ADR-0038).
func TestNotificationRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewNotificationRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
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

// The email job reads unread, not emailed notifications of the window, oldest first, only of users
// who keep emails on; a marked one is not read again (ADR-0038).
func TestNotificationRepositoryListToEmail(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewNotificationRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	f := factory.NewNotificationFactory(id.New())
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	project := createProject(t, pool, "Дизайн-система")
	for _, u := range []*entity.UserAccount{anna, ivan} {
		if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member')`, project, u.ID); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `UPDATE users SET email_notifications = FALSE WHERE id = $1`, anna.ID); err != nil {
		t.Fatal(err)
	}
	task := entity.TaskID(insertTask(t, pool, project, anna, ivan))
	write := func(user *entity.UserAccount, at time.Time) *entity.Notification {
		t.Helper()
		n := f.New(user.ID, task, nil, entity.NotifyAssigned, at)
		if err := repo.Create(ctx, n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	from, to := now.Add(-24*time.Hour), now.Add(-5*time.Minute)
	second := write(ivan, now.Add(-10*time.Minute))
	first := write(ivan, now.Add(-time.Hour))
	read := write(ivan, now.Add(-10*time.Minute))
	emailed := write(ivan, now.Add(-10*time.Minute))
	write(ivan, now.Add(-25*time.Hour))
	write(ivan, now.Add(-time.Minute))
	write(anna, now.Add(-10*time.Minute))
	if err := repo.SetReadAt(ctx, read.ID, &now); err != nil {
		t.Fatal(err)
	}
	if err := repo.MarkEmailed(ctx, emailed.ID, now); err != nil {
		t.Fatal(err)
	}

	list, err := repo.ListToEmail(ctx, from, to, 50)
	if err != nil {
		t.Fatal(err)
	}
	var ids []entity.NotificationID
	for _, v := range list {
		ids = append(ids, v.View.Notification.ID)
		if v.Recipient.ID != ivan.ID || v.Recipient.Email != ivan.Email || v.View.TaskName != "Задача" || v.View.TaskKey == "" {
			t.Fatalf("view: %+v %+v", v.Recipient, v.View)
		}
	}
	if !slices.Equal(ids, []entity.NotificationID{first.ID, second.ID}) {
		t.Fatalf("to email: %v", ids)
	}
	if limited, err := repo.ListToEmail(ctx, from, to, 1); err != nil || len(limited) != 1 {
		t.Fatalf("limit: %d, %v", len(limited), err)
	}
	if err := repo.MarkEmailed(ctx, first.ID, now); err != nil {
		t.Fatal(err)
	}
	if list, err := repo.ListToEmail(ctx, from, to, 50); err != nil || len(list) != 1 || list[0].View.Notification.ID != second.ID {
		t.Fatalf("after mark: %d, %v", len(list), err)
	}
	requireCode(t, repo.MarkEmailed(ctx, entity.NotificationID(id.New().Generate()), now), domain.EntityNotFound)
}

// Reminders go to the assignee of an active, unresolved task once per task, kind and date (ADR-0038).
func TestNotificationRepositoryCreateDueReminders(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewNotificationRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	project := createProject(t, pool, "Дизайн-система")
	if _, err := pool.Exec(ctx, `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'member')`, project, ivan.ID); err != nil {
		t.Fatal(err)
	}
	tomorrow, yesterday := "2026-10-22", "2026-10-20"
	task := func(due string, assignee *entity.UserAccount, set string) entity.TaskID {
		t.Helper()
		taskID := insertTask(t, pool, project, anna, assignee)
		if _, err := pool.Exec(ctx, `UPDATE tasks SET due_date = $1`+set+` WHERE id = $2`, due, taskID); err != nil {
			t.Fatal(err)
		}
		return entity.TaskID(taskID)
	}
	soon := task(tomorrow, ivan, "")
	late := task(yesterday, ivan, "")
	task("2026-10-23", ivan, "")
	task(tomorrow, ivan, ", status = 'done'")
	task(yesterday, ivan, ", archived_at = now()")
	task(tomorrow, nil, "")
	dueSoon := time.Date(2026, 10, 22, 0, 0, 0, 0, time.UTC)
	overdue := time.Date(2026, 10, 20, 0, 0, 0, 0, time.UTC)
	resolved := []entity.TaskStatus{entity.StatusDone}

	if n, err := repo.CreateDueReminders(ctx, dueSoon, overdue, resolved, now); err != nil || n != 2 {
		t.Fatalf("first run: %d, %v", n, err)
	}
	if n, err := repo.CreateDueReminders(ctx, dueSoon, overdue, resolved, now.Add(time.Hour)); err != nil || n != 0 {
		t.Fatalf("second run: %d, %v", n, err)
	}
	list, err := repo.ListForUser(ctx, ivan.ID, 100)
	if err != nil || len(list) != 2 {
		t.Fatalf("reminders: %d, %v", len(list), err)
	}
	got := map[entity.TaskID]*entity.Notification{}
	for _, v := range list {
		got[v.Notification.TaskID] = v.Notification
	}
	for taskID, want := range map[entity.TaskID]struct {
		kind entity.NotificationKind
		date string
	}{soon: {entity.NotifyDueSoon, tomorrow}, late: {entity.NotifyOverdue, yesterday}} {
		n := got[taskID]
		if n == nil || n.Kind != want.kind || n.DueDate == nil || *n.DueDate != want.date || n.ActorID != nil ||
			n.UserID != ivan.ID || !n.CreatedAt.Equal(now) {
			t.Fatalf("reminder of %s: %+v", taskID, n)
		}
	}
}
