package v1_test

import (
	"fmt"
	"net/http"
	"strings"
	"testing"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type label struct {
	ID        string `json:"id"`
	ProjectID string `json:"projectId"`
	Name      string `json:"name"`
	Color     string `json:"color"`
}

// createLabel creates a label of the project as the current user.
func createLabel(t *testing.T, s *apitest.Server, projectID, name, color string) label {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/projects/"+projectID+"/labels", map[string]any{"name": name, "color": color})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[label](t, rec)
}

func listLabels(t *testing.T, s *apitest.Server, projectID string) []string {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/projects/"+projectID+"/labels", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	names := []string{}
	for _, l := range apitest.Decode[[]label](t, rec) {
		names = append(names, l.Name)
	}
	return names
}

func setLabels(t *testing.T, s *apitest.Server, taskID string, ids ...string) task {
	t.Helper()
	if ids == nil {
		ids = []string{}
	}
	rec := s.Do(http.MethodPut, "/v1/tasks/"+taskID+"/labels", map[string]any{"labelIds": ids})
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[task](t, rec)
}

func taskLabelNames(tk task) string {
	names := make([]string, len(tk.Labels))
	for i, l := range tk.Labels {
		names[i] = l.Name
	}
	return strings.Join(names, ",")
}

func getTask(t *testing.T, s *apitest.Server, id string) task {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/tasks/"+id, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[task](t, rec)
}

// Any member creates labels; the owner and admins rename, recolor and delete them; a member gets 403,
// a non-member 404; an archived project only lists them (ADR-0035).
func TestProjectLabels(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	p := createProject(t, s, "Дизайн").Project.ID
	path := "/v1/projects/" + p + "/labels"
	olga := signUp(t, s, p, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodPatch, "/v1/projects/"+p+"/members/"+olga.ID, map[string]string{"role": "admin"}), http.StatusOK)
	signUp(t, s, p, "ivan@example.com", "Иван")

	bug := createLabel(t, s, p, "Баг", "red")
	if bug.ProjectID != p || bug.Name != "Баг" || bug.Color != "red" {
		t.Fatalf("created %+v", bug)
	}
	login(t, s, "admin@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodPost, path, map[string]any{"name": " баг ", "color": "blue"}), http.StatusConflict, "LABEL_NAME_TAKEN")
	other := createProject(t, s, "Бэкенд").Project.ID
	createLabel(t, s, other, "Баг", "red")
	createLabel(t, s, p, "  API ", "gray")

	login(t, s, "ivan@example.com", password)
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/"+bug.ID, map[string]any{"name": "Ошибка"}), http.StatusForbidden, "FORBIDDEN")
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/"+bug.ID, nil), http.StatusForbidden, "FORBIDDEN")

	login(t, s, "olga@example.com", password)
	rec := s.Do(http.MethodPatch, path+"/"+bug.ID, map[string]any{"name": "Ошибка", "color": "green"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[label](t, rec); got.Name != "Ошибка" || got.Color != "green" {
		t.Fatalf("updated %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/"+bug.ID, map[string]any{"name": "api"}), http.StatusConflict, "LABEL_NAME_TAKEN")
	if got := strings.Join(listLabels(t, s, p), ","); got != "API,Ошибка" {
		t.Fatalf("labels %s", got)
	}

	login(t, s, "admin@example.com", password)
	tk := createTask(t, s, p, "Кнопка", "")
	if got := taskLabelNames(setLabels(t, s, tk.ID, bug.ID)); got != "Ошибка" {
		t.Fatalf("task labels %s", got)
	}
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/"+bug.ID, nil), http.StatusNoContent)
	if got := getTask(t, s, tk.ID); len(got.Labels) != 0 {
		t.Fatalf("labels after delete: %+v", got.Labels)
	}
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/"+bug.ID, nil), http.StatusNotFound, "NOT_FOUND")
	foreign := createLabel(t, s, other, "Чужая", "teal")
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/"+foreign.ID, map[string]any{"color": "red"}), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/"+foreign.ID, nil), http.StatusNotFound, "NOT_FOUND")

	api := createLabel(t, s, p, "Бэк", "blue")
	signUp(t, s, other, "petr@example.com", "Пётр")
	for _, c := range []struct {
		method, path string
		body         any
	}{
		{http.MethodGet, path, nil},
		{http.MethodPost, path, map[string]any{"name": "Взлом", "color": "red"}},
		{http.MethodPatch, path + "/" + api.ID, map[string]any{"name": "Взлом"}},
		{http.MethodDelete, path + "/" + api.ID, nil},
	} {
		apitest.RequireError(t, s.Do(c.method, c.path, c.body), http.StatusNotFound, "NOT_FOUND")
	}

	login(t, s, "admin@example.com", password)
	setArchived[project](t, s, "/v1/projects/"+p, true)
	apitest.RequireError(t, s.Do(http.MethodPost, path, map[string]any{"name": "Новая", "color": "red"}), http.StatusConflict, "PROJECT_ARCHIVED")
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/"+api.ID, map[string]any{"name": "Новая"}), http.StatusConflict, "PROJECT_ARCHIVED")
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/"+api.ID, nil), http.StatusConflict, "PROJECT_ARCHIVED")
	if got := strings.Join(listLabels(t, s, p), ","); got != "API,Бэк" {
		t.Fatalf("labels of an archived project %s", got)
	}
}

// A label name is 1–30 characters after trimming; the color is from the palette; a change names a field.
func TestLabelValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	p := createProject(t, s, "Дизайн").Project.ID
	path := "/v1/projects/" + p + "/labels"
	l := createLabel(t, s, p, strings.Repeat("я", 30), "purple")
	for _, c := range []struct {
		method, path string
		body         any
		field        string
	}{
		{http.MethodPost, path, map[string]any{"name": strings.Repeat("я", 31), "color": "red"}, "name"},
		{http.MethodPost, path, map[string]any{"name": "", "color": "red"}, "name"},
		{http.MethodPost, path, map[string]any{"name": "   ", "color": "red"}, "name"},
		{http.MethodPost, path, map[string]any{"name": "Баг", "color": "pink"}, "color"},
		{http.MethodPost, path, map[string]any{"name": "Баг"}, "color"},
		{http.MethodPatch, path + "/" + l.ID, map[string]any{}, "name"},
		{http.MethodPatch, path + "/" + l.ID, map[string]any{"name": "  "}, "name"},
		{http.MethodPatch, path + "/" + l.ID, map[string]any{"color": "pink"}, "color"},
	} {
		apiErr := apitest.RequireError(t, s.Do(c.method, c.path, c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[c.field]; !ok {
			t.Errorf("%s %v: details lack %s: %v", c.method, c.body, c.field, apiErr.Details)
		}
	}
}

// A task gets up to 10 labels of its project, ordered by name, in every task response; a move to
// another project removes them (ADR-0035).
func TestTaskLabels(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	p := createProject(t, s, "Дизайн").Project.ID
	other := createProject(t, s, "Бэкенд").Project.ID
	bug := createLabel(t, s, p, "Баг", "red")
	api := createLabel(t, s, p, "API", "blue")
	foreign := createLabel(t, s, other, "Чужая", "gray")
	tk := createTask(t, s, p, "Меточная кнопка", admin.ID)
	if len(tk.Labels) != 0 || tk.Labels == nil {
		t.Fatalf("labels of a new task: %#v", tk.Labels)
	}

	got := setLabels(t, s, tk.ID, bug.ID, strings.ToUpper(api.ID))
	if names := taskLabelNames(got); names != "API,Баг" || got.Labels[0].ID != api.ID || got.Labels[0].Color != "blue" ||
		got.Labels[0].ProjectID != p {
		t.Fatalf("task labels %+v", got.Labels)
	}

	b := createBoard(t, s, "Доска", []string{p})
	for _, path := range []string{"/v1/projects/" + p + "/tasks", "/v1/users/me/tasks", "/v1/boards/" + b.ID + "/tasks"} {
		rec := s.Do(http.MethodGet, path, nil)
		apitest.RequireStatus(t, rec, http.StatusOK)
		tasks := apitest.Decode[[]task](t, rec)
		if len(tasks) != 1 || taskLabelNames(tasks[0]) != "API,Баг" {
			t.Errorf("%s: %+v", path, tasks)
		}
	}
	if found := searchFor(t, s, "Меточная").Tasks; len(found) != 1 || taskLabelNames(found[0]) != "API,Баг" {
		t.Errorf("search: %+v", found)
	}

	if got := setLabels(t, s, tk.ID); len(got.Labels) != 0 {
		t.Fatalf("labels after clearing: %+v", got.Labels)
	}

	path := "/v1/tasks/" + tk.ID + "/labels"
	eleven := make([]string, 11)
	for i := range eleven {
		eleven[i] = fmt.Sprintf("5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c%02d", i)
	}
	for _, body := range []map[string]any{
		{"labelIds": eleven},
		{"labelIds": []string{bug.ID, bug.ID}},
		{"labelIds": []string{"not-a-uuid"}},
		{},
	} {
		apitest.RequireError(t, s.Do(http.MethodPut, path, body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	}
	apiErr := apitest.RequireError(t, s.Do(http.MethodPut, path, map[string]any{"labelIds": eleven}), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	if _, ok := apiErr.Details["labelIds"]; !ok {
		t.Errorf("details lack labelIds: %v", apiErr.Details)
	}
	apitest.RequireError(t, s.Do(http.MethodPut, path, map[string]any{"labelIds": []string{bug.ID, foreign.ID}}),
		http.StatusUnprocessableEntity, "LABEL_UNAVAILABLE")
	if got := getTask(t, s, tk.ID); len(got.Labels) != 0 {
		t.Fatalf("labels after a refused change: %+v", got.Labels)
	}

	setLabels(t, s, tk.ID, bug.ID)
	if moved := changeTask(t, s, "/v1/tasks/"+tk.ID+"/project", map[string]any{"projectId": other}); len(moved.Labels) != 0 {
		t.Fatalf("labels after a move: %+v", moved.Labels)
	}
	if got := getTask(t, s, tk.ID); len(got.Labels) != 0 {
		t.Fatalf("labels after a move: %+v", got.Labels)
	}

	setLabels(t, s, tk.ID, foreign.ID)
	setArchived[task](t, s, "/v1/tasks/"+tk.ID, true)
	apitest.RequireError(t, s.Do(http.MethodPut, path, map[string]any{"labelIds": []string{}}), http.StatusConflict, "TASK_ARCHIVED")

	signUp(t, s, p, "ivan@example.com", "Иван")
	apitest.RequireError(t, s.Do(http.MethodPut, path, map[string]any{"labelIds": []string{}}), http.StatusNotFound, "NOT_FOUND")
}
