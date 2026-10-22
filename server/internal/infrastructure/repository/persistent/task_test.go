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

// describeTask — поля задачи строкой: время из базы приходит в поясе сервера, сравниваем в UTC.
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
	return fmt.Sprintf("%s %s %q %q %s author=%s assignee=%s %s %s", t.ID, t.ProjectID, t.Name, deref(t.Description),
		t.Status, t.AuthorID, deref(assignee), t.CreatedAt.UTC().Format(time.RFC3339), t.UpdatedAt.UTC().Format(time.RFC3339))
}

// Задача пишется и читается целиком; списки — новые первыми, без удалённых задач; задачи
// исполнителя — только в проектах, где он участник.
func TestTaskRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewTaskRepo(pool)
	members := persistent.NewProjectMemberRepo(pool, factory.NewUserFactory(id.New(), clock.New(now)))
	clk := clock.New(now)
	f := factory.NewTaskFactory(id.New(), clk)
	anna := createUser(t, pool, "anna@example.com", "Анна")
	ivan := createUser(t, pool, "ivan@example.com", "Иван")
	design := createProject(t, pool, "Дизайн-система")
	backend := createProject(t, pool, "Бэкенд")
	annaDesign, ivanDesign, annaBackend := entity.NewMember(design, anna.ID, now), entity.NewMember(design, ivan.ID, now), entity.NewMember(backend, anna.ID, now)
	for _, m := range []*entity.ProjectMember{annaDesign, ivanDesign, annaBackend} {
		if err := members.Add(ctx, m); err != nil {
			t.Fatal(err)
		}
	}
	newTask := func(author *entity.ProjectMember, name string, description *string, assignee *entity.ProjectMember) *entity.Task {
		t.Helper()
		task, err := f.New(author, name, description, assignee)
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
	button := newTask(annaDesign, "Кнопка", &description, ivanDesign)
	form := newTask(annaDesign, "Форма", nil, nil)
	api := newTask(annaBackend, "API", nil, nil)
	// Иван — исполнитель задачи проекта, где он не участник: такую задачу ему не показывают
	if _, err := pool.Exec(ctx, `UPDATE tasks SET assignee_id = $1 WHERE id = $2`, ivan.ID, api.ID); err != nil {
		t.Fatal(err)
	}

	got, err := repo.Get(ctx, button.ID)
	if err != nil || describeTask(got) != describeTask(button) {
		t.Fatalf("прочитана %v, %v\nзаписана %s", got, err, describeTask(button))
	}
	if ids := taskIDs(repo.ListInProject(ctx, design)); !slices.Equal(ids, []entity.TaskID{form.ID, button.ID}) {
		t.Errorf("задачи проекта: %v", ids)
	}
	if ids := taskIDs(repo.ListAssigned(ctx, ivan.ID)); !slices.Equal(ids, []entity.TaskID{button.ID}) {
		t.Errorf("задачи Ивана: %v", ids)
	}

	later := now.Add(time.Hour)
	button.Rename("Большая кнопка", later)
	button.Describe(nil, later)
	button.ChangeStatus(entity.StatusDone, later)
	button.MoveTo(backend, nil, later)
	if err := repo.Update(ctx, button); err != nil {
		t.Fatal(err)
	}
	if got, err := repo.Get(ctx, button.ID); err != nil || describeTask(got) != describeTask(button) {
		t.Fatalf("после изменения %v, %v\nожидалась %s", got, err, describeTask(button))
	}
	if ids := taskIDs(repo.ListInProject(ctx, backend)); !slices.Equal(ids, []entity.TaskID{api.ID, button.ID}) {
		t.Errorf("задачи бэкенда: %v", ids)
	}
	if ids := taskIDs(repo.ListAssigned(ctx, ivan.ID)); len(ids) != 0 {
		t.Errorf("задачи Ивана после переноса: %v", ids)
	}

	if err := repo.SoftDelete(ctx, form.ID, later); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.SoftDelete(ctx, form.ID, later), domain.EntityNotFound)
	requireCode(t, repo.Update(ctx, form), domain.EntityNotFound)
	_, err = repo.Get(ctx, form.ID)
	requireCode(t, err, domain.EntityNotFound)
	if ids := taskIDs(repo.ListInProject(ctx, design)); len(ids) != 0 {
		t.Errorf("задачи проекта после удаления: %v", ids)
	}
	var deletedAt time.Time
	if err := pool.QueryRow(ctx, `SELECT deleted_at FROM tasks WHERE id = $1`, form.ID).Scan(&deletedAt); err != nil || !deletedAt.Equal(later) {
		t.Fatalf("удаление мягкое: %v, %v", deletedAt, err)
	}
	_, err = repo.Get(ctx, entity.TaskID(id.New().Generate()))
	requireCode(t, err, domain.EntityNotFound)
}
