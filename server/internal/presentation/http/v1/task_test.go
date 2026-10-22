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
	ID          string  `json:"id"`
	ProjectID   string  `json:"projectId"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	StatusID    string  `json:"statusId"`
	AuthorID    string  `json:"authorId"`
	AssigneeID  *string `json:"assigneeId"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
}

type taskStatus struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	IsDefault  bool   `json:"isDefault"`
	IsResolved bool   `json:"isResolved"`
}

// createTask создаёт задачу от текущего пользователя; assignee — ID исполнителя или пусто.
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

// changeTask отправляет изменение задачи и возвращает задачу из ответа.
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

// Статусы фиксированы и идут в порядке работы над задачей (ADR-0003).
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
		t.Fatalf("статусы: %+v", got)
	}
	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/task-statuses", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
}

// Любой участник создаёт задачу, меняет её по одной операции (ADR-0002) и удаляет мягко;
// ответ на изменение — вся задача, время — в UTC.
func TestTaskLifecycle(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")

	rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{
		"projectId": design, "name": "Кнопка", "description": "Основная", "assigneeId": admin.ID,
	})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	button := apitest.Decode[task](t, rec)
	want := task{
		ID: button.ID, ProjectID: design, Name: "Кнопка", Description: ptr("Основная"), StatusID: "open",
		AuthorID: ivan.ID, AssigneeID: &admin.ID, CreatedAt: "2026-10-21T12:00:00Z", UpdatedAt: "2026-10-21T12:00:00Z",
	}
	if !reflect.DeepEqual(button, want) {
		t.Fatalf("задача: %+v", button)
	}
	s.Clock.Advance(time.Minute)
	form := createTask(t, s, design, "Форма", "")
	if form.Description != nil || form.AssigneeID != nil {
		t.Fatalf("задача без описания и исполнителя: %+v", form)
	}
	rec = s.Do(http.MethodGet, "/v1/tasks/"+button.ID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[task](t, rec); !reflect.DeepEqual(got, button) {
		t.Fatalf("по ID: %+v", got)
	}
	if got := listTasks(t, s, "/v1/projects/"+design+"/tasks"); !slices.Equal(got, []string{form.ID, button.ID}) {
		t.Fatalf("задачи проекта: %v", got)
	}
	if n := tasksCount(t, s, design); n != 2 {
		t.Fatalf("задач в проекте: %d", n)
	}

	s.Clock.Advance(time.Minute)
	path := "/v1/tasks/" + button.ID
	got := changeTask(t, s, path, map[string]any{"name": "Большая кнопка"})
	want.Name, want.UpdatedAt = "Большая кнопка", "2026-10-21T12:02:00Z"
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("после переименования: %+v", got)
	}
	got = changeTask(t, s, path, `{"description": null}`)
	want.Description = nil
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("без описания: %+v", got)
	}
	got = changeTask(t, s, path+"/status", map[string]any{"statusId": "in_progress"})
	want.StatusID = "in_progress"
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("после смены статуса: %+v", got)
	}
	got = changeTask(t, s, path+"/assignee", `{"assigneeId": null}`)
	want.AssigneeID = nil
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("без исполнителя: %+v", got)
	}
	if got = changeTask(t, s, path+"/assignee", map[string]any{"assigneeId": ivan.ID}); got.AssigneeID == nil || *got.AssigneeID != ivan.ID {
		t.Fatalf("исполнитель: %+v", got)
	}

	// Исполнитель — только участник проекта
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
		t.Fatalf("задачи после удаления: %v", got)
	}
	if n := tasksCount(t, s, design); n != 1 {
		t.Fatalf("задач в проекте после удаления: %d", n)
	}
}

// Не участник проекта задачу не видит и не меняет: 404, как будто её нет (ADR-0018).
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
		t.Errorf("задачи чужого: %v", got)
	}

	login(t, s, "admin@example.com", password)
	rec := s.Do(http.MethodGet, path, nil)
	if got := apitest.Decode[task](t, rec); !reflect.DeepEqual(got, button) {
		t.Fatalf("задача изменилась: %+v", got)
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
		{http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Кнопка", "statusId": "done"}, "statusId"},
		{http.MethodPatch, path, map[string]any{}, "name"},
		{http.MethodPatch, path, `{"name": null}`, "name"},
		{http.MethodPatch, path, map[string]any{"name": ""}, "name"},
		{http.MethodPatch, path + "/status", map[string]any{}, "statusId"},
		{http.MethodPatch, path + "/status", map[string]any{"statusId": "closed"}, "statusId"},
		{http.MethodPatch, path + "/assignee", map[string]any{}, "assigneeId"},
		{http.MethodPatch, path + "/assignee", map[string]any{"assigneeId": "42"}, "assigneeId"},
		{http.MethodPatch, path + "/project", map[string]any{}, "projectId"},
		{http.MethodPatch, path + "/project", map[string]any{"projectId": "42"}, "projectId"},
	}
	for _, c := range cases {
		apiErr := apitest.RequireError(t, s.Do(c.method, c.path, c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[c.field]; !ok {
			t.Errorf("%s %s %v: в details нет %s: %v", c.method, c.path, c.body, c.field, apiErr.Details)
		}
	}

	// UUID в теле — в любом регистре; в ответе — как в базе, строчными
	got := createTask(t, s, strings.ToUpper(design), "Кнопка", strings.ToUpper(admin.ID))
	if got.ProjectID != design || *got.AssigneeID != admin.ID {
		t.Fatalf("задача по ID в верхнем регистре: %+v", got)
	}
}

// Переносит участник обоих проектов; статус сохраняется, исполнитель — если он участник
// нового проекта.
func TestMoveTask(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
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

	s.Clock.Advance(time.Minute)
	moved := changeTask(t, s, "/v1/tasks/"+button.ID+"/project", map[string]any{"projectId": backend})
	if moved.ProjectID != backend || moved.AssigneeID != nil || moved.StatusID != "in_review" || moved.UpdatedAt != "2026-10-21T12:02:00Z" {
		t.Fatalf("перенос, исполнитель не участник бэкенда: %+v", moved)
	}
	if moved = changeTask(t, s, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": backend}); moved.AssigneeID == nil || *moved.AssigneeID != anna.ID {
		t.Fatalf("перенос, исполнитель участник бэкенда: %+v", moved)
	}
	if got := listTasks(t, s, "/v1/projects/"+backend+"/tasks"); !slices.Equal(got, []string{form.ID, button.ID}) {
		t.Fatalf("задачи бэкенда: %v", got)
	}
	if got := listTasks(t, s, "/v1/projects/"+design+"/tasks"); len(got) != 0 {
		t.Fatalf("задачи дизайн-системы: %v", got)
	}
	if moved = changeTask(t, s, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": backend}); moved.ProjectID != backend || *moved.AssigneeID != anna.ID {
		t.Fatalf("перенос в тот же проект: %+v", moved)
	}

	// В проект, где вы не участник, и в удалённый — 404; задача остаётся на месте
	old := createProject(t, s, "Старый").Project.ID
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+old, nil), http.StatusNoContent)
	for _, target := range []string{personal, old, "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"} {
		apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+form.ID+"/project", map[string]any{"projectId": target}),
			http.StatusNotFound, "NOT_FOUND")
	}
	// Иван — участник только дизайн-системы: перенесённую задачу он больше не видит
	login(t, s, "ivan@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/tasks/"+button.ID, nil), http.StatusNotFound, "NOT_FOUND")
	login(t, s, "anna@example.com", password)
	rec := s.Do(http.MethodGet, "/v1/tasks/"+form.ID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[task](t, rec); got.ProjectID != backend {
		t.Fatalf("задача после отказов: %+v", got)
	}
}

// Мои задачи — назначенные на меня во всех моих проектах, новые первыми; удалённые задачи
// и задачи удалённых проектов — нет.
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
		t.Fatalf("задачи Ивана: %v", got)
	}
	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+backend, nil), http.StatusNoContent)
	login(t, s, "ivan@example.com", password)
	if got := listTasks(t, s, "/v1/users/me/tasks"); !slices.Equal(got, []string{button.ID}) {
		t.Fatalf("задачи Ивана после удаления проекта: %v", got)
	}
}

// Задача меняется под блокировкой проекта: параллельные изменения не затирают друг друга,
// а исполнителем не остаётся исключённый участник.
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
			t.Fatalf("после %d-го круга: %+v", i, got)
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
			t.Fatalf("после %d-го круга исполнитель — исключённый участник: %+v", i, got)
		}
	}
}
