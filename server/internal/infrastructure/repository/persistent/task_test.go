package persistent_test

import (
	"context"
	"fmt"
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

// describeTask renders task fields as a string: times from the database come in the server's zone, so we compare in UTC.
func describeTask(t *entity.Task) string {
	deref := func(s *string) string {
		if s == nil {
			return "<nil>"
		}
		return *s
	}
	var assignee *string
	if t.AssigneeID != nil {
		a := string(*t.AssigneeID)
		assignee = &a
	}
	archived := "<nil>"
	if t.ArchivedAt != nil {
		archived = t.ArchivedAt.UTC().Format(time.RFC3339)
	}
	dueDate := "<nil>"
	if t.DueDate != nil {
		dueDate = entity.FormatDueDate(*t.DueDate)
	}
	return fmt.Sprintf("%s %s %s %q %q %s %s due=%s author=%s assignee=%s archived=%s projectArchived=%v %s %s", t.ID, t.ProjectID, t.Key(), t.Name,
		deref(t.Description), t.Status, t.Priority, dueDate, t.AuthorID, deref(assignee), archived, t.ProjectArchived,
		t.CreatedAt.UTC().Format(time.RFC3339), t.UpdatedAt.UTC().Format(time.RFC3339))
}

// A task is written and read in full; lists put newest first and skip deleted tasks; an assignee's
// tasks come only from projects where they are a member.
func TestTaskRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewTaskRepo(pool)
	members := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	clk := clock.New(now)
	f := factory.NewTaskFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	projects := persistent.NewProjectRepo(pool)
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	keyOf := func(id entity.ProjectID) entity.ProjectKey {
		t.Helper()
		p, err := projects.GetForUpdate(ctx, id)
		if err != nil {
			t.Fatal(err)
		}
		return p.Key
	}
	nextNumber := func(id entity.ProjectID) int {
		t.Helper()
		n, err := projects.NextTaskNumber(ctx, id)
		if err != nil {
			t.Fatal(err)
		}
		return n
	}
	annaDesign, ivanDesign, annaBackend := entity.NewMember(design, anna.ID, now), entity.NewMember(design, ivan.ID, now), entity.NewMember(backend, anna.ID, now)
	for _, m := range []*entity.ProjectMember{annaDesign, ivanDesign, annaBackend} {
		if err := members.Add(ctx, m); err != nil {
			t.Fatal(err)
		}
	}
	newTask := func(author *entity.ProjectMember, draft entity.TaskDraft, assignee *entity.ProjectMember) *entity.Task {
		t.Helper()
		draft.Status = entity.DefaultTaskStatus()
		task, err := f.New(author, keyOf(author.ProjectID), nextNumber(author.ProjectID), draft, assignee)
		if err == nil {
			err = repo.Create(ctx, task)
		}
		if err != nil {
			t.Fatal(err)
		}
		clk.Advance(time.Minute)
		return task
	}
	taskIDs := func(tasks []*entity.Task, err error) []entity.TaskID {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
		var ids []entity.TaskID
		for _, task := range tasks {
			ids = append(ids, task.ID)
		}
		return ids
	}
	description := "Основная кнопка"
	dueDate := entity.NewDueDate(2026, time.October, 30)
	button := newTask(annaDesign, entity.TaskDraft{Name: "Кнопка", Description: &description, Priority: entity.PriorityHigh, DueDate: &dueDate}, ivanDesign)
	form := newTask(annaDesign, entity.TaskDraft{Name: "Форма"}, nil)
	api := newTask(annaBackend, entity.TaskDraft{Name: "API"}, nil)
	// Ivan is the assignee of a task in a project where he is not a member: such a task is not shown to him
	if _, err := pool.Exec(ctx, `UPDATE tasks SET assignee_id = $1 WHERE id = $2`, ivan.ID, api.ID); err != nil {
		t.Fatal(err)
	}

	got, err := repo.Get(ctx, button.ID)
	if err != nil || describeTask(got) != describeTask(button) || got.Key() != string(keyOf(design))+"-1" ||
		got.DueDate == nil || !got.DueDate.Equal(dueDate) || got.DueDate.Location() != time.UTC {
		t.Fatalf("read %v, %v\nwritten %s", got, err, describeTask(button))
	}
	if ids := taskIDs(repo.ListInProject(ctx, design, false)); !slices.Equal(ids, []entity.TaskID{form.ID, button.ID}) {
		t.Errorf("project tasks: %v", ids)
	}
	if ids := taskIDs(repo.ListAssigned(ctx, ivan.ID, false)); !slices.Equal(ids, []entity.TaskID{button.ID}) {
		t.Errorf("Ivan's tasks: %v", ids)
	}

	later := now.Add(time.Hour)
	button.Rename("Большая кнопка", later)
	button.Describe(nil, later)
	button.ChangeStatus(entity.StatusDone, later)
	button.ChangePriority(entity.PriorityUrgent, later)
	button.SetDueDate(nil, later)
	button.MoveTo(backend, keyOf(backend), nextNumber(backend), nil, later)
	if err := repo.Update(ctx, button); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.Get(ctx, button.ID); err != nil || describeTask(got) != describeTask(button) {
		t.Fatalf("after update %v, %v\nexpected %s", got, err, describeTask(button))
	}
	if button.Number != 2 {
		t.Errorf("the moved task got number %d in the backend project", button.Number)
	}
	if ids := taskIDs(repo.ListInProject(ctx, backend, false)); !slices.Equal(ids, []entity.TaskID{api.ID, button.ID}) {
		t.Errorf("backend tasks: %v", ids)
	}
	if ids := taskIDs(repo.ListAssigned(ctx, ivan.ID, false)); len(ids) != 0 {
		t.Errorf("Ivan's tasks after the move: %v", ids)
	}

	if err := repo.SoftDelete(ctx, form.ID, later); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.SoftDelete(ctx, form.ID, later), domain.EntityNotFound)
	requireCode(t, repo.Update(ctx, form), domain.EntityNotFound)
	_, err = repo.Get(ctx, form.ID)
	requireCode(t, err, domain.EntityNotFound)
	if ids := taskIDs(repo.ListInProject(ctx, design, false)); len(ids) != 0 {
		t.Errorf("project tasks after delete: %v", ids)
	}
	var deletedAt time.Time
	if err := pool.QueryRow(ctx, `SELECT deleted_at FROM tasks WHERE id = $1`, form.ID).Scan(&deletedAt); err != nil || !deletedAt.Equal(later) {
		t.Fatalf("delete is soft: %v, %v", deletedAt, err)
	}
	_, err = repo.Get(ctx, entity.TaskID(id.New().Generate()))
	requireCode(t, err, domain.EntityNotFound)
}

// Archive (ADR-0027): Update writes archived_at, tasks read their project's flag; project lists filter
// by the task's own flag, the assignee's lists — by the task's or the project's; leaving a project
// clears the assignee of archived tasks too.
func TestTaskArchive(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewTaskRepo(pool)
	projects := persistent.NewProjectRepo(pool)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	members := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	for _, m := range []*entity.ProjectMember{
		entity.NewMember(design, anna.ID, now), entity.NewMember(design, ivan.ID, now), entity.NewMember(backend, ivan.ID, now),
	} {
		if err := members.Add(ctx, m); err != nil {
			t.Fatal(err)
		}
	}
	get := func(id string) *entity.Task {
		t.Helper()
		task, err := repo.Get(ctx, entity.TaskID(id))
		if err != nil {
			t.Fatal(err)
		}
		return task
	}
	ids := func(tasks []*entity.Task, err error) []string {
		t.Helper()
		if err != nil {
			t.Fatal(err)
		}
		var out []string
		for _, task := range tasks {
			out = append(out, string(task.ID))
		}
		slices.Sort(out)
		return out
	}
	sorted := func(ids ...string) []string {
		slices.Sort(ids)
		return ids
	}

	active := insertTask(t, pool, design, anna, ivan)
	archived := get(insertTask(t, pool, design, anna, ivan))
	inBackend := insertTask(t, pool, backend, ivan, ivan)
	later := now.Add(time.Hour)
	archived.Archive(later)
	if err := repo.Update(ctx, archived); err != nil {
		t.Fatal(err)
	}
	if got := get(string(archived.ID)); got.ArchivedAt == nil || !got.ArchivedAt.Equal(later) || !got.UpdatedAt.Equal(later) || got.ProjectArchived {
		t.Fatalf("archived task: %s", describeTask(got))
	}

	backendProject, err := projects.GetForUpdate(ctx, backend)
	if err != nil {
		t.Fatal(err)
	}
	backendProject.Archive(later)
	if err := projects.Update(ctx, backendProject); err != nil {
		t.Fatal(err)
	}
	if got := get(inBackend); !got.ProjectArchived || got.ArchivedAt != nil {
		t.Fatalf("task of an archived project: %s", describeTask(got))
	}

	if got := ids(repo.ListInProject(ctx, design, false)); !slices.Equal(got, []string{active}) {
		t.Errorf("active design tasks: %v", got)
	}
	if got := ids(repo.ListInProject(ctx, design, true)); !slices.Equal(got, []string{string(archived.ID)}) {
		t.Errorf("archived design tasks: %v", got)
	}
	// In an archived project, the tabs go by the task's own flag
	if got := ids(repo.ListInProject(ctx, backend, false)); !slices.Equal(got, []string{inBackend}) {
		t.Errorf("active backend tasks: %v", got)
	}
	if got := ids(repo.ListAssigned(ctx, ivan.ID, false)); !slices.Equal(got, []string{active}) {
		t.Errorf("Ivan's active tasks: %v", got)
	}
	if got := ids(repo.ListAssigned(ctx, ivan.ID, true)); !slices.Equal(got, sorted(string(archived.ID), inBackend)) {
		t.Errorf("Ivan's archived tasks: %v", got)
	}

	unassigned, err := repo.UnassignInProject(ctx, design, ivan.ID, later)
	if err != nil {
		t.Fatal(err)
	}
	if got := sorted(func() []string {
		var out []string
		for _, id := range unassigned {
			out = append(out, string(id))
		}
		return out
	}()...); !slices.Equal(got, sorted(active, string(archived.ID))) {
		t.Errorf("unassigned tasks: %v", got)
	}
	if got := get(string(archived.ID)); got.AssigneeID != nil {
		t.Errorf("leaving clears the assignee of an archived task: %s", describeTask(got))
	}

	archived.Restore(later.Add(time.Hour))
	if err := repo.Update(ctx, archived); err != nil {
		t.Fatal(err)
	}
	if got := get(string(archived.ID)); got.ArchivedAt != nil {
		t.Fatalf("restored task: %s", describeTask(got))
	}
}
