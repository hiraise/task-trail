package v1_test

import (
	"net/http"
	"slices"
	"testing"
	"time"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

// setArchived archives or restores a task or a project (path — /v1/tasks/{id} or /v1/projects/{id})
// and returns the response.
func setArchived[T any](t *testing.T, s *apitest.Server, path string, archived bool) T {
	t.Helper()
	rec := s.Do(http.MethodPatch, path+"/archived", map[string]any{"archived": archived})
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[T](t, rec)
}

func listProjects(t *testing.T, s *apitest.Server, path string) []string {
	t.Helper()
	rec := s.Do(http.MethodGet, path, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	ids := []string{}
	for _, p := range apitest.Decode[[]project](t, rec) {
		ids = append(ids, p.ID)
	}
	return ids
}

// Any member archives and restores a task; an archived task is read-only, it can be restored and
// deleted; lists split by the archive flag, tasksCount skips archived tasks (ADR-0027).
func TestTaskArchive(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	button := createTask(t, s, design, "Кнопка", ivan.ID)
	form := createTask(t, s, design, "Форма", ivan.ID)
	path := "/v1/tasks/" + button.ID

	s.Clock.Advance(time.Minute)
	got := setArchived[task](t, s, path, true)
	if got.ArchivedAt == nil || *got.ArchivedAt != "2026-10-21T12:01:00Z" || got.UpdatedAt != "2026-10-21T12:01:00Z" || got.ProjectArchived {
		t.Fatalf("archived task: %+v", got)
	}
	s.Clock.Advance(time.Minute)
	if again := setArchived[task](t, s, path, true); *again.ArchivedAt != *got.ArchivedAt || again.UpdatedAt != got.UpdatedAt {
		t.Fatalf("archived again: %+v", again)
	}

	if ids := listTasks(t, s, "/v1/projects/"+design+"/tasks"); !slices.Equal(ids, []string{form.ID}) {
		t.Fatalf("active project tasks: %v", ids)
	}
	if ids := listTasks(t, s, "/v1/projects/"+design+"/tasks?archived=true"); !slices.Equal(ids, []string{button.ID}) {
		t.Fatalf("archived project tasks: %v", ids)
	}
	if ids := listTasks(t, s, "/v1/users/me/tasks?archived=false"); !slices.Equal(ids, []string{form.ID}) {
		t.Fatalf("Ivan's active tasks: %v", ids)
	}
	if ids := listTasks(t, s, "/v1/users/me/tasks?archived=true"); !slices.Equal(ids, []string{button.ID}) {
		t.Fatalf("Ivan's archived tasks: %v", ids)
	}
	if n := tasksCount(t, s, design); n != 1 {
		t.Fatalf("tasksCount: %d", n)
	}

	conflict := func(method, path string, body any) {
		t.Helper()
		apitest.RequireError(t, s.Do(method, path, body), http.StatusConflict, "TASK_ARCHIVED")
	}
	conflict(http.MethodPatch, path, map[string]any{"name": "Новое"})
	conflict(http.MethodPatch, path+"/status", map[string]any{"statusId": "done"})
	conflict(http.MethodPatch, path+"/priority", map[string]any{"priority": "urgent"})
	conflict(http.MethodPatch, path+"/due-date", map[string]any{"dueDate": "2026-10-30"})
	conflict(http.MethodPatch, path+"/assignee", map[string]any{"assigneeId": nil})
	conflict(http.MethodPatch, path+"/project", map[string]any{"projectId": backend})

	if restored := setArchived[task](t, s, path, false); restored.ArchivedAt != nil || restored.UpdatedAt != "2026-10-21T12:02:00Z" {
		t.Fatalf("restored: %+v", restored)
	}
	changeTask(t, s, path+"/status", map[string]any{"statusId": "done"})

	setArchived[task](t, s, path, true)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/archived", map[string]any{"archived": false}), http.StatusNotFound, "NOT_FOUND")

	// A non-member does not learn about the task
	login(t, s, "admin@example.com", password)
	signUp(t, s, backend, "petr@example.com", "Пётр")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+form.ID+"/archived", map[string]any{"archived": true}),
		http.StatusNotFound, "NOT_FOUND")
}

// Only the owner archives a project. An archived project is read-only together with its members and
// tasks; it can be restored, deleted and left. Its tasks keep their own flags (ADR-0027).
func TestProjectArchive(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	created := createProject(t, s, "Дизайн-система").Project
	design, path := created.ID, "/v1/projects/"+created.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	olga := signUp(t, s, design, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	addMembers(t, s, backend, "ivan@example.com")
	apitest.RequireStatus(t, s.Do(http.MethodPatch, path+"/members/"+olga.ID, map[string]string{"role": "admin"}), http.StatusOK)
	active := createTask(t, s, design, "Кнопка", ivan.ID)
	own := createTask(t, s, design, "Форма", ivan.ID)
	setArchived[task](t, s, "/v1/tasks/"+own.ID, true)
	elsewhere := createTask(t, s, backend, "API", "")

	login(t, s, "olga@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/archived", map[string]any{"archived": true}), http.StatusForbidden, "FORBIDDEN")

	login(t, s, "admin@example.com", password)
	s.Clock.Advance(time.Minute)
	got := setArchived[project](t, s, path, true)
	if got.ArchivedAt == nil || *got.ArchivedAt != "2026-10-21T12:01:00Z" || got.UpdatedAt != "2026-10-21T12:01:00Z" ||
		got.Role != "owner" || got.TasksCount != 1 {
		t.Fatalf("archived project: %+v", got)
	}
	if ids := listProjects(t, s, "/v1/projects"); !slices.Equal(ids, []string{backend}) {
		t.Fatalf("active projects: %v", ids)
	}
	if ids := listProjects(t, s, "/v1/projects?archived=true"); !slices.Equal(ids, []string{design}) {
		t.Fatalf("archived projects: %v", ids)
	}
	// The tabs of an archived project go by the task's own flag
	if ids := listTasks(t, s, path+"/tasks"); !slices.Equal(ids, []string{active.ID}) {
		t.Fatalf("project tasks: %v", ids)
	}
	rec := s.Do(http.MethodGet, "/v1/tasks/"+active.ID, nil)
	if got := apitest.Decode[task](t, rec); !got.ProjectArchived || got.ArchivedAt != nil {
		t.Fatalf("task of an archived project: %+v", got)
	}

	// Every change of the project, its members and tasks — 409
	conflict := func(method, path string, body any) {
		t.Helper()
		apitest.RequireError(t, s.Do(method, path, body), http.StatusConflict, "PROJECT_ARCHIVED")
	}
	conflict(http.MethodPatch, path, map[string]any{"name": "Новое"})
	conflict(http.MethodPost, path+"/members", map[string]any{"emails": []string{"x@example.com"}})
	conflict(http.MethodPatch, path+"/members/"+olga.ID, map[string]string{"role": "member"})
	conflict(http.MethodDelete, path+"/members/"+olga.ID, nil)
	conflict(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Новая"})
	for _, id := range []string{active.ID, own.ID} {
		taskPath := "/v1/tasks/" + id
		conflict(http.MethodPatch, taskPath, map[string]any{"name": "Новое"})
		conflict(http.MethodPatch, taskPath+"/status", map[string]any{"statusId": "done"})
		conflict(http.MethodPatch, taskPath+"/priority", map[string]any{"priority": "urgent"})
		conflict(http.MethodPatch, taskPath+"/due-date", map[string]any{"dueDate": "2026-10-30"})
		conflict(http.MethodPatch, taskPath+"/assignee", map[string]any{"assigneeId": nil})
		conflict(http.MethodPatch, taskPath+"/project", map[string]any{"projectId": backend})
		conflict(http.MethodPatch, taskPath+"/archived", map[string]any{"archived": false})
		conflict(http.MethodDelete, taskPath, nil)
	}
	// Into an archived project — 409 too
	conflict(http.MethodPatch, "/v1/tasks/"+elsewhere.ID+"/project", map[string]any{"projectId": design})

	// Ivan's tasks of an archived project are in his archive tab
	login(t, s, "ivan@example.com", password)
	if ids := listTasks(t, s, "/v1/users/me/tasks"); len(ids) != 0 {
		t.Fatalf("Ivan's active tasks: %v", ids)
	}
	// Both were created at the same moment, so the order between them is by ID
	if ids := listTasks(t, s, "/v1/users/me/tasks?archived=true"); !slices.Equal(slices.Sorted(slices.Values(ids)), slices.Sorted(slices.Values([]string{own.ID, active.ID}))) {
		t.Fatalf("Ivan's archived tasks: %v", ids)
	}
	// Leaving an archived project is allowed and clears the assignee of every task, archived ones too
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/leave", nil), http.StatusNoContent)
	var assigned int
	if err := s.Pool.QueryRow(t.Context(), `SELECT count(*) FROM tasks WHERE project_id = $1 AND assignee_id = $2`, design, ivan.ID).
		Scan(&assigned); err != nil || assigned != 0 {
		t.Fatalf("Ivan is still the assignee of %d tasks, %v", assigned, err)
	}

	login(t, s, "admin@example.com", password)
	restored := setArchived[project](t, s, path, false)
	if restored.ArchivedAt != nil {
		t.Fatalf("restored project: %+v", restored)
	}
	// Tasks archived on their own stay archived
	if ids := listTasks(t, s, path+"/tasks?archived=true"); !slices.Equal(ids, []string{own.ID}) {
		t.Fatalf("archived tasks after restoring the project: %v", ids)
	}
	changeTask(t, s, "/v1/tasks/"+active.ID+"/status", map[string]any{"statusId": "done"})

	setArchived[project](t, s, path, true)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path, nil), http.StatusNoContent)
}

// archived is true or false; another value — 422 with details.archived. The body needs archived.
func TestArchiveValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	button := createTask(t, s, design, "Кнопка", "")
	for _, path := range []string{"/v1/projects?archived=yes", "/v1/projects/" + design + "/tasks?archived=1", "/v1/users/me/tasks?archived="} {
		e := apitest.RequireError(t, s.Do(http.MethodGet, path, nil), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if e.Details["archived"] == "" {
			t.Errorf("%s: details %v", path, e.Details)
		}
	}
	for _, body := range []any{map[string]any{}, `{"archived": null}`, map[string]any{"archived": "true"}} {
		apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+button.ID+"/archived", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/projects/"+design+"/archived", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	}
}
