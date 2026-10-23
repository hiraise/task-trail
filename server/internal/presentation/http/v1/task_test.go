package v1_test

import (
	"fmt"
	"net/http"
	"reflect"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type task struct {
	ID              string  `json:"id"`
	ProjectID       string  `json:"projectId"`
	Number          int     `json:"number"`
	Key             string  `json:"key"`
	Name            string  `json:"name"`
	Description     *string `json:"description"`
	StatusID        string  `json:"statusId"`
	Priority        string  `json:"priority"`
	DueDate         *string `json:"dueDate"`
	AuthorID        string  `json:"authorId"`
	AssigneeID      *string `json:"assigneeId"`
	ArchivedAt      *string `json:"archivedAt"`
	ProjectArchived bool    `json:"projectArchived"`
	Labels          []label `json:"labels"`
	CreatedAt       string  `json:"createdAt"`
	UpdatedAt       string  `json:"updatedAt"`
}

type taskStatus struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsDefault  bool   `json:"isDefault"`
	IsResolved bool   `json:"isResolved"`
}

// createTask creates a task as the current user; assignee is the assignee ID or empty.
func createTask(t *testing.T, s *apitest.Server, projectID, name, assignee string) task {
	t.Helper()
	body := map[string]any{"projectId": projectID, "name": name}
	if assignee != "" {
		body["assigneeId"] = assignee
	}
	rec := s.Do(http.MethodPost, "/v1/tasks", body)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[task](t, rec)
}

// changeTask sends a task change and returns the task from the response.
func changeTask(t *testing.T, s *apitest.Server, path string, body any) task {
	t.Helper()
	rec := s.Do(http.MethodPatch, path, body)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[task](t, rec)
}

func listTasks(t *testing.T, s *apitest.Server, path string) []string {
	t.Helper()
	rec := s.Do(http.MethodGet, path, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	ids := []string{}
	for _, item := range apitest.Decode[[]task](t, rec) {
		ids = append(ids, item.ID)
	}
	return ids
}

func tasksCount(t *testing.T, s *apitest.Server, projectID string) int {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/projects/"+projectID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[project](t, rec).TasksCount
}

func ptr(s string) *string { return &s }

// Statuses are fixed and follow the order of work on a task (ADR-0003).
func TestTaskStatuses(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)

	rec := s.Do(http.MethodGet, "/v1/task-statuses", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	want := []taskStatus{
		{ID: "open", Name: "Открыта", IsDefault: true},
		{ID: "in_progress", Name: "В работе"},
		{ID: "in_review", Name: "На проверке"},
		{ID: "done", Name: "Готово", IsResolved: true},
	}
	if got := apitest.Decode[[]taskStatus](t, rec); !slices.Equal(got, want) {
		t.Fatalf("statuses: %+v", got)
	}
	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/task-statuses", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// Any member creates a task, changes it one operation at a time (ADR-0002) and soft-deletes it;
// the change response is the whole task, time in UTC.
func TestTaskLifecycle(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	designProject := createProject(t, s, "Дизайн-система").Project
	design := designProject.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")

	rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{
		"projectId": design, "name": "Кнопка", "description": "Основная", "assigneeId": admin.ID,
	})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	button := apitest.Decode[task](t, rec)
	want := task{
		ID: button.ID, ProjectID: design, Number: 1, Key: designProject.Key + "-1", Name: "Кнопка", Description: ptr("Основная"), StatusID: "open", Priority: "normal",
		AuthorID: ivan.ID, AssigneeID: &admin.ID, Labels: []label{}, CreatedAt: "2026-10-21T12:00:00Z", UpdatedAt: "2026-10-21T12:00:00Z",
	}
	if !reflect.DeepEqual(button, want) {
		t.Fatalf("task: %+v", button)
	}
	s.Clock.Advance(time.Minute)
	form := createTask(t, s, design, "Форма", "")
	if form.Description != nil || form.AssigneeID != nil || form.Number != 2 || form.Key != designProject.Key+"-2" {
		t.Fatalf("task without description and assignee: %+v", form)
	}
	rec = s.Do(http.MethodGet, "/v1/tasks/"+button.ID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[task](t, rec); !reflect.DeepEqual(got, button) {
		t.Fatalf("by ID: %+v", got)
	}
	if got := listTasks(t, s, "/v1/projects/"+design+"/tasks"); !slices.Equal(got, []string{form.ID, button.ID}) {
		t.Fatalf("project tasks: %v", got)
	}
	if n := tasksCount(t, s, design); n != 2 {
		t.Fatalf("tasks in project: %d", n)
	}

	s.Clock.Advance(time.Minute)
	path := "/v1/tasks/" + button.ID
	got := changeTask(t, s, path, map[string]any{"name": "Большая кнопка"})
	want.Name, want.UpdatedAt = "Большая кнопка", "2026-10-21T12:02:00Z"
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("after rename: %+v", got)
	}
	got = changeTask(t, s, path, `{"description": null}`)
	want.Description = nil
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("without description: %+v", got)
	}
	got = changeTask(t, s, path+"/status", map[string]any{"statusId": "in_progress"})
	want.StatusID = "in_progress"
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("after status change: %+v", got)
	}
	got = changeTask(t, s, path+"/assignee", `{"assigneeId": null}`)
	want.AssigneeID = nil
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("without assignee: %+v", got)
	}
	if got = changeTask(t, s, path+"/assignee", map[string]any{"assigneeId": ivan.ID}); got.AssigneeID == nil || *got.AssigneeID != ivan.ID {
		t.Fatalf("assignee: %+v", got)
	}

	// Only a project member can be the assignee
	login(t, s, "admin@example.com", password)
	olga := signUp(t, s, createProject(t, s, "Чужой").Project.ID, "olga@example.com", "Ольга")
	login(t, s, "ivan@example.com", password)
	for _, assignee := range []string{olga.ID, "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"} {
		apitest.RequireError(t, s.Do(http.MethodPatch, path+"/assignee", map[string]any{"assigneeId": assignee}),
			http.StatusUnprocessableEntity, "ASSIGNEE_NOT_MEMBER")
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Ещё", "assigneeId": assignee}),
			http.StatusUnprocessableEntity, "ASSIGNEE_NOT_MEMBER")
	}

	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/tasks/"+form.ID, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/tasks/"+form.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodDelete, "/v1/tasks/"+form.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+form.ID+"/status", map[string]any{"statusId": "done"}),
		http.StatusNotFound, "NOT_FOUND")
	if got := listTasks(t, s, "/v1/projects/"+design+"/tasks"); !slices.Equal(got, []string{button.ID}) {
		t.Fatalf("tasks after deletion: %v", got)
	}
	if n := tasksCount(t, s, design); n != 1 {
		t.Fatalf("tasks in project after deletion: %d", n)
	}
	// A deleted task keeps its number: the next task gets a new one (ADR-0026)
	if next := createTask(t, s, design, "Таблица", ""); next.Number != 3 {
		t.Fatalf("number after delete: %+v", next)
	}
}

// statusId creates the task right in that status (a board column, ADR-0029); without it — the
// default status.
func TestCreateTaskInStatus(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	for _, status := range []string{"in_progress", "done"} {
		rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "statusId": status})
		apitest.RequireStatus(t, rec, http.StatusCreated)
		if got := apitest.Decode[task](t, rec); got.StatusID != status {
			t.Fatalf("task in %s: %+v", status, got)
		}
	}
	if got := createTask(t, s, design, "Форма", ""); got.StatusID != "open" {
		t.Fatalf("task without statusId: %+v", got)
	}
}

// A task without priority is normal; a change writes priority_changed, the same value — nothing (ADR-0033).
func TestTaskPriority(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s).Email
	design := createProject(t, s, "Дизайн-система").Project.ID
	if got := createTask(t, s, design, "Форма", ""); got.Priority != "normal" {
		t.Fatalf("task without priority: %+v", got)
	}
	rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "priority": "high"})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	button := apitest.Decode[task](t, rec)
	if button.Priority != "high" {
		t.Fatalf("task with priority high: %+v", button)
	}
	path := "/v1/tasks/" + button.ID + "/priority"
	if got := changeTask(t, s, path, map[string]any{"priority": "urgent"}); got.Priority != "urgent" {
		t.Fatalf("after the change: %+v", got)
	}
	history := []string{"priority_changed by " + admin + " high→urgent", "created by " + admin}
	requireEvents(t, s, button.ID, history...)
	if got := changeTask(t, s, path, map[string]any{"priority": "urgent"}); got.Priority != "urgent" {
		t.Fatalf("the same priority: %+v", got)
	}
	requireEvents(t, s, button.ID, history...)
}

// A due date is a day or null: set on creation, changed and removed with due_date_changed; the same
// value writes nothing; a past day is accepted (ADR-0034).
func TestTaskDueDate(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s).Email
	design := createProject(t, s, "Дизайн-система").Project.ID
	if got := createTask(t, s, design, "Форма", ""); got.DueDate != nil {
		t.Fatalf("task without a due date: %+v", got)
	}
	rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "dueDate": "2026-10-30"})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	button := apitest.Decode[task](t, rec)
	if button.DueDate == nil || *button.DueDate != "2026-10-30" {
		t.Fatalf("task with a due date: %+v", button)
	}
	if got := apitest.Decode[task](t, s.Do(http.MethodGet, "/v1/tasks/"+button.ID, nil)); !reflect.DeepEqual(got, button) {
		t.Fatalf("read back: %+v", got)
	}
	path := "/v1/tasks/" + button.ID + "/due-date"
	if got := changeTask(t, s, path, map[string]any{"dueDate": "2026-11-02"}); got.DueDate == nil || *got.DueDate != "2026-11-02" {
		t.Fatalf("after the change: %+v", got)
	}
	if got := changeTask(t, s, path, `{"dueDate": null}`); got.DueDate != nil {
		t.Fatalf("after the removal: %+v", got)
	}
	history := []string{
		"due_date_changed by " + admin + " 2026-11-02→-",
		"due_date_changed by " + admin + " 2026-10-30→2026-11-02",
		"created by " + admin,
	}
	requireEvents(t, s, button.ID, history...)
	changeTask(t, s, path, `{"dueDate": null}`)
	requireEvents(t, s, button.ID, history...)
	if got := changeTask(t, s, path, map[string]any{"dueDate": "2020-01-01"}); got.DueDate == nil || *got.DueDate != "2020-01-01" {
		t.Fatalf("a past date: %+v", got)
	}
}

// A non-member neither sees nor changes the task: 404, as if it did not exist (ADR-0018).
func TestTaskAccess(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	button := createTask(t, s, design, "Кнопка", "")
	other := createProject(t, s, "Бэкенд").Project.ID
	signUp(t, s, other, "stranger@example.com", "Чужой")

	path := "/v1/tasks/" + button.ID
	for _, c := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, path, nil},
		{http.MethodPatch, path, map[string]any{"name": "Чужая"}},
		{http.MethodDelete, path, nil},
		{http.MethodPatch, path + "/status", map[string]any{"statusId": "done"}},
		{http.MethodPatch, path + "/priority", map[string]any{"priority": "urgent"}},
		{http.MethodPatch, path + "/due-date", map[string]any{"dueDate": "2026-10-30"}},
		{http.MethodPatch, path + "/assignee", `{"assigneeId": null}`},
		{http.MethodPatch, path + "/project", map[string]any{"projectId": other}},
		{http.MethodGet, "/v1/projects/" + design + "/tasks", nil},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Чужая"}},
		{http.MethodGet, "/v1/tasks/5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e", nil},
		{http.MethodGet, "/v1/tasks/not-a-uuid", nil},
		{http.MethodPatch, "/v1/tasks/not-a-uuid/status", map[string]any{"statusId": "done"}},
		{http.MethodGet, "/v1/projects/not-a-uuid/tasks", nil},
	} {
		rec := s.Do(c.method, c.path, c.body)
		if body := apitest.Decode[apitest.Error](t, rec); rec.Code != http.StatusNotFound || body.Code != "NOT_FOUND" {
			t.Errorf("%s %s: %d %s", c.method, c.path, rec.Code, rec.Body.String())
		}
	}
	if got := listTasks(t, s, "/v1/users/me/tasks"); len(got) != 0 {
		t.Errorf("stranger's tasks: %v", got)
	}

	login(t, s, "admin@example.com", password)
	rec := s.Do(http.MethodGet, path, nil)
	if got := apitest.Decode[task](t, rec); !reflect.DeepEqual(got, button) {
		t.Fatalf("task changed: %+v", got)
	}
	anonymous(t, s)
	for _, p := range []string{path, "/v1/projects/" + design + "/tasks", "/v1/users/me/tasks"} {
		apitest.RequireError(t, s.Do(http.MethodGet, p, nil), http.StatusUnauthorized, "UNAUTHENTICATED")
	}
}

func TestTaskValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	path := "/v1/tasks/" + createTask(t, s, design, "Кнопка", "").ID
	cases := []struct {
		method, path string
		body         any
		field        string
	}{
		{http.MethodPost, "/v1/tasks", map[string]any{"name": "Кнопка"}, "projectId"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": "42", "name": "Кнопка"}, "projectId"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design}, "name"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": ""}, "name"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": strings.Repeat("я", 255)}, "name"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "assigneeId": "42"}, "assigneeId"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "statusId": "closed"}, "statusId"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "priority": "top"}, "priority"},
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "dueDate": "30.10.2026"}, "dueDate"},
		{http.MethodPatch, path, map[string]any{}, "name"},
		{http.MethodPatch, path, `{"name": null}`, "name"},
		{http.MethodPatch, path, map[string]any{"name": ""}, "name"},
		{http.MethodPatch, path + "/status", map[string]any{}, "statusId"},
		{http.MethodPatch, path + "/status", map[string]any{"statusId": "closed"}, "statusId"},
		{http.MethodPatch, path + "/priority", map[string]any{}, "priority"},
		{http.MethodPatch, path + "/priority", map[string]any{"priority": "top"}, "priority"},
		{http.MethodPatch, path + "/due-date", map[string]any{}, "dueDate"},
		{http.MethodPatch, path + "/due-date", map[string]any{"dueDate": "30.10.2026"}, "dueDate"},
		{http.MethodPatch, path + "/due-date", map[string]any{"dueDate": "2026-02-30"}, "dueDate"},
		{http.MethodPatch, path + "/due-date", map[string]any{"dueDate": "2026-10-30T00:00:00Z"}, "dueDate"},
		{http.MethodPatch, path + "/assignee", map[string]any{}, "assigneeId"},
		{http.MethodPatch, path + "/assignee", map[string]any{"assigneeId": "42"}, "assigneeId"},
		{http.MethodPatch, path + "/project", map[string]any{}, "projectId"},
		{http.MethodPatch, path + "/project", map[string]any{"projectId": "42"}, "projectId"},
	}
	for _, c := range cases {
		apiErr := apitest.RequireError(t, s.Do(c.method, c.path, c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[c.field]; !ok {
			t.Errorf("%s %s %v: details lack %s: %v", c.method, c.path, c.body, c.field, apiErr.Details)
		}
	}

	// The due date texts: a missing field and a wrong format (ADR-0034)
	for body, want := range map[string]string{`{}`: "обязательное поле", `{"dueDate": "30.10.2026"}`: "нужна дата ГГГГ-ММ-ДД"} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, path+"/due-date", body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if apiErr.Details["dueDate"] != want {
			t.Errorf("%s: %v", body, apiErr.Details)
		}
	}

	// A UUID in the body may be in any case; in the response it is as in the database, lowercase
	got := createTask(t, s, strings.ToUpper(design), "Кнопка", strings.ToUpper(admin.ID))
	if got.ProjectID != design || *got.AssigneeID != admin.ID {
		t.Fatalf("task by uppercase ID: %+v", got)
	}
}

// A member of both projects moves the task; the status stays, the assignee stays if a member
// of the new project.
func TestMoveTask(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backendProject := createProject(t, s, "Бэкенд").Project
	backend := backendProject.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	anna := signUp(t, s, design, "anna@example.com", "Анна")
	personal := createProject(t, s, "Личный").Project.ID
	login(t, s, "admin@example.com", password)
	addMembers(t, s, backend, "anna@example.com")

	button := createTask(t, s, design, "Кнопка", ivan.ID)
	changeTask(t, s, "/v1/tasks/"+button.ID+"/status", map[string]any{"statusId": "in_review"})
	s.Clock.Advance(time.Minute)
	form := createTask(t, s, design, "Форма", anna.ID)
	createTask(t, s, backend, "API", "")

	s.Clock.Advance(time.Minute)
	moved := changeTask(t, s, "/v1/tasks/"+button.ID+"/project", map[string]any{"projectId": backend})
	if moved.ProjectID != backend || moved.Number != 2 || moved.Key != backendProject.Key+"-2" || moved.AssigneeID != nil || moved.StatusID != "in_review" || moved.UpdatedAt != "2026-10-21T12:02:00Z" {
		t.Fatalf("move, assignee not a backend member: %+v", moved)
	}
	if moved = changeTask(t, s, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": backend}); moved.AssigneeID == nil || *moved.AssigneeID != anna.ID ||
		moved.Key != backendProject.Key+"-3" {
		t.Fatalf("move, assignee is a backend member: %+v", moved)
	}
	if got := listTasks(t, s, "/v1/projects/"+backend+"/tasks"); len(got) != 3 || !slices.Contains(got, form.ID) || !slices.Contains(got, button.ID) {
		t.Fatalf("backend tasks: %v", got)
	}
	if got := listTasks(t, s, "/v1/projects/"+design+"/tasks"); len(got) != 0 {
		t.Fatalf("design system tasks: %v", got)
	}
	before := moved
	if moved = changeTask(t, s, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": backend}); !reflect.DeepEqual(moved, before) {
		t.Fatalf("move to the same project changed the task: %+v, before %+v", moved, before)
	}

	// To a project you are not a member of, or a deleted one — 404; the task stays put
	old := createProject(t, s, "Старый").Project.ID
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+old, nil), http.StatusNoContent)
	for _, target := range []string{personal, old, "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"} {
		apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": target}),
			http.StatusNotFound, "NOT_FOUND")
	}
	// Ivan is a member of the design system only: he no longer sees the moved task
	login(t, s, "ivan@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/tasks/"+button.ID, nil), http.StatusNotFound, "NOT_FOUND")
	login(t, s, "anna@example.com", password)
	rec := s.Do(http.MethodGet, "/v1/tasks/"+form.ID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[task](t, rec); got.ProjectID != backend {
		t.Fatalf("task after rejections: %+v", got)
	}
}

// My tasks are those assigned to me in all my projects, newest first; deleted tasks
// and tasks of deleted projects are excluded.
func TestCurrentUserTasks(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	addMembers(t, s, backend, "ivan@example.com")

	button := createTask(t, s, design, "Кнопка", ivan.ID)
	s.Clock.Advance(time.Minute)
	api := createTask(t, s, backend, "API", ivan.ID)
	s.Clock.Advance(time.Minute)
	createTask(t, s, design, "Форма", "")
	createTask(t, s, design, "Шрифты", admin.ID)
	gone := createTask(t, s, backend, "Удалённая", ivan.ID)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/tasks/"+gone.ID, nil), http.StatusNoContent)

	login(t, s, "ivan@example.com", password)
	if got := listTasks(t, s, "/v1/users/me/tasks"); !slices.Equal(got, []string{api.ID, button.ID}) {
		t.Fatalf("Ivan's tasks: %v", got)
	}
	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+backend, nil), http.StatusNoContent)
	login(t, s, "ivan@example.com", password)
	if got := listTasks(t, s, "/v1/users/me/tasks"); !slices.Equal(got, []string{button.ID}) {
		t.Fatalf("Ivan's tasks after project deletion: %v", got)
	}
}

// A task changes under the project lock: parallel changes do not overwrite each other,
// and a removed member does not remain the assignee.
func TestTaskConcurrentChanges(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	path := "/v1/tasks/" + createTask(t, s, design, "Кнопка", "").ID
	parallel := func(requests ...func()) {
		var wg sync.WaitGroup
		for _, request := range requests {
			wg.Go(request)
		}
		wg.Wait()
	}
	current := func() task {
		t.Helper()
		rec := s.Do(http.MethodGet, path, nil)
		apitest.RequireStatus(t, rec, http.StatusOK)
		return apitest.Decode[task](t, rec)
	}

	for i := range 20 {
		name, status := fmt.Sprintf("Кнопка %d", i), []string{"in_progress", "done"}[i%2]
		parallel(
			func() { s.Do(http.MethodPatch, path, map[string]any{"name": name}) },
			func() { s.Do(http.MethodPatch, path+"/status", map[string]any{"statusId": status}) },
		)
		if got := current(); got.Name != name || got.StatusID != status {
			t.Fatalf("after round %d: %+v", i, got)
		}
	}
	s.RemoveMember(design, ivan.ID)
	for i := range 20 {
		s.AddMember(design, ivan.ID, entity.RoleMember)
		parallel(
			func() { s.Do(http.MethodPatch, path+"/assignee", map[string]any{"assigneeId": ivan.ID}) },
			func() { s.Do(http.MethodDelete, "/v1/projects/"+design+"/members/"+ivan.ID, nil) },
		)
		if got := current(); got.AssigneeID != nil {
			t.Fatalf("after round %d the assignee is a removed member: %+v", i, got)
		}
	}
}
