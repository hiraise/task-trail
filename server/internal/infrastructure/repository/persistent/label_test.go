package persistent_test

import (
	"context"
	"testing"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/infrastructure/repository/persistent"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/test/clock"
	"task-trail/test/testdb"
)

var _ repository.LabelRepository = (*persistent.PGLabelRepository)(nil)

func labelNames(labels []*entity.Label) []string {
	names := make([]string, len(labels))
	for i, l := range labels {
		names[i] = l.Name
	}
	return names
}

func taskLabelNames(labels []entity.Label) []string {
	names := make([]string, len(labels))
	for i, l := range labels {
		names[i] = l.Name
	}
	return names
}

func requireNames(t *testing.T, got, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("names = %v, want %v", got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("names = %v, want %v", got, want)
		}
	}
}

// Label names are unique in a project ignoring case; labels of a task come with the task ordered by
// name, and deleting a label removes it from tasks (ADR-0035).
func TestLabelRepository(t *testing.T) {
	pool := testdb.New(t)
	ctx := context.Background()
	repo := persistent.NewLabelRepo(pool)
	tasks := persistent.NewTaskRepo(pool)
	f := factory.NewLabelFactory(id.New(), clock.New(now))
	anna := createUser(t, pool, "anna@example.com", "Анна")
	design := createProject(t, pool, "Дизайн")
	backend := createProject(t, pool, "Бэкенд")
	create := func(project entity.ProjectID, name string) *entity.Label {
		t.Helper()
		l := f.New(project, name, entity.LabelBlue)
		if err := repo.Create(ctx, l); err != nil {
			t.Fatal(err)
		}
		return l
	}

	bug := create(design, "Баг")
	requireCode(t, repo.Create(ctx, f.New(design, "баг", entity.LabelRed)), domain.LabelNameTaken)
	backendBug := create(backend, "Баг")
	ui := create(design, "ui")
	api := create(design, "API")

	list, err := repo.ListInProject(ctx, design)
	if err != nil {
		t.Fatal(err)
	}
	requireNames(t, labelNames(list), []string{"API", "ui", "Баг"})

	ui.Rename("API", now)
	requireCode(t, repo.Update(ctx, ui), domain.LabelNameTaken)
	ui.Rename("Интерфейс", now)
	ui.Recolor(entity.LabelGreen, now)
	if err := repo.Update(ctx, ui); err != nil {
		t.Fatal(err)
	}
	got, err := repo.Get(ctx, design, ui.ID)
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "Интерфейс" || got.Color != entity.LabelGreen {
		t.Fatalf("label = %+v", got)
	}
	_, err = repo.Get(ctx, backend, ui.ID)
	requireCode(t, err, domain.EntityNotFound)

	byIDs, err := repo.ListByIDs(ctx, design, []entity.LabelID{bug.ID, backendBug.ID, api.ID})
	if err != nil {
		t.Fatal(err)
	}
	if len(byIDs) != 2 {
		t.Fatalf("ListByIDs = %v, want two labels of the project", labelNames(byIDs))
	}

	taskID := entity.TaskID(insertTask(t, pool, design, anna, nil))
	task, err := tasks.Get(ctx, taskID)
	if err != nil {
		t.Fatal(err)
	}
	if task.Labels == nil || len(task.Labels) != 0 {
		t.Fatalf("labels of a new task = %#v, want an empty slice", task.Labels)
	}
	if err := repo.ReplaceForTask(ctx, taskID, []entity.LabelID{bug.ID, ui.ID, api.ID}); err != nil {
		t.Fatal(err)
	}
	task, err = tasks.Get(ctx, taskID)
	if err != nil {
		t.Fatal(err)
	}
	requireNames(t, taskLabelNames(task.Labels), []string{"API", "Баг", "Интерфейс"})
	if l := task.Labels[0]; l.ID != api.ID || l.ProjectID != design || l.Color != entity.LabelBlue {
		t.Fatalf("label = %+v", l)
	}

	if err := repo.Delete(ctx, bug.ID); err != nil {
		t.Fatal(err)
	}
	requireCode(t, repo.Delete(ctx, bug.ID), domain.EntityNotFound)
	task, err = tasks.Get(ctx, taskID)
	if err != nil {
		t.Fatal(err)
	}
	requireNames(t, taskLabelNames(task.Labels), []string{"API", "Интерфейс"})

	if err := repo.ReplaceForTask(ctx, taskID, nil); err != nil {
		t.Fatal(err)
	}
	if err := repo.ReplaceForTask(ctx, taskID, []entity.LabelID{api.ID}); err != nil {
		t.Fatal(err)
	}
	if err := repo.ClearTask(ctx, taskID); err != nil {
		t.Fatal(err)
	}
	task, err = tasks.Get(ctx, taskID)
	if err != nil {
		t.Fatal(err)
	}
	if len(task.Labels) != 0 {
		t.Fatalf("labels after ClearTask = %v", taskLabelNames(task.Labels))
	}
}
