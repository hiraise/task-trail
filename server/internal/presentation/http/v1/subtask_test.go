package v1_test

import (
	"net/http"
	"slices"
	"testing"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

const unknownID = "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"

func createSubtask(t *testing.T, s *apitest.Server, projectID, parentID, name string) task {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": projectID, "name": name, "parentId": parentID})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[task](t, rec)
}

// A subtask is created with parentId; the parent counts non-archived subtasks and the resolved ones;
// the list of subtasks goes by number, archived ones included, only to members (ADR-0036).
func TestSubtasks(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	parent := createTask(t, s, design, "Форма", "")
	first := createSubtask(t, s, design, parent.ID, "Поля")
	second := createSubtask(t, s, design, parent.ID, "Кнопка")
	if first.ParentID == nil || *first.ParentID != parent.ID || first.SubtasksTotal != 0 {
		t.Fatalf("subtask: %+v", first)
	}
	requireEvents(t, s, first.ID, "created by admin@example.com")
	if got := getTask(t, s, parent.ID); got.ParentID != nil || got.SubtasksTotal != 2 || got.SubtasksDone != 0 {
		t.Fatalf("parent: %+v", got)
	}
	changeTask(t, s, "/v1/tasks/"+first.ID+"/status", map[string]any{"statusId": "done"})
	if got := getTask(t, s, parent.ID); got.SubtasksTotal != 2 || got.SubtasksDone != 1 {
		t.Fatalf("parent with a done subtask: %+v", got)
	}
	changeTask(t, s, "/v1/tasks/"+second.ID+"/archived", map[string]any{"archived": true})
	if got := getTask(t, s, parent.ID); got.SubtasksTotal != 1 || got.SubtasksDone != 1 {
		t.Fatalf("parent with an archived subtask: %+v", got)
	}
	if got := listTasks(t, s, "/v1/tasks/"+parent.ID+"/subtasks"); !slices.Equal(got, []string{first.ID, second.ID}) {
		t.Fatalf("subtasks: %v", got)
	}
	if got := listTasks(t, s, "/v1/tasks/"+first.ID+"/subtasks"); len(got) != 0 {
		t.Fatalf("subtasks of a subtask: %v", got)
	}

	other := createProject(t, s, "Чужой").Project.ID
	signUp(t, s, other, "olga@example.com", "Ольга")
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/tasks/"+parent.ID+"/subtasks", nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+parent.ID+"/parent", map[string]any{"parentId": nil}),
		http.StatusNotFound, "NOT_FOUND")
}

// One level, the same project, not itself; an unknown parent is TASK_PARENT_INVALID, an archived
// one — TASK_ARCHIVED (ADR-0036).
func TestSubtaskRules(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	parent := createTask(t, s, design, "Форма", "")
	sub := createSubtask(t, s, design, parent.ID, "Поля")
	alone := createTask(t, s, design, "Отдельная", "")
	elsewhere := createTask(t, s, backend, "Сервер", "")

	for name, parentID := range map[string]string{
		"a subtask of a subtask": sub.ID, "another project": elsewhere.ID, "unknown": unknownID,
	} {
		rec := s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Ещё", "parentId": parentID})
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("create, %s: %d %s", name, rec.Code, rec.Body)
			continue
		}
		apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "TASK_PARENT_INVALID")
		apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+alone.ID+"/parent", map[string]any{"parentId": parentID}),
			http.StatusUnprocessableEntity, "TASK_PARENT_INVALID")
	}
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+alone.ID+"/parent", map[string]any{"parentId": alone.ID}),
		http.StatusUnprocessableEntity, "TASK_PARENT_INVALID")
	// A task with subtasks does not become a subtask
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+parent.ID+"/parent", map[string]any{"parentId": alone.ID}),
		http.StatusUnprocessableEntity, "TASK_PARENT_INVALID")
	for _, body := range []map[string]any{{}, {"parentId": "42"}} {
		apiErr := apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+alone.ID+"/parent", body),
			http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details["parentId"]; !ok {
			t.Errorf("details for %v: %v", body, apiErr.Details)
		}
	}

	changeTask(t, s, "/v1/tasks/"+parent.ID+"/archived", map[string]any{"archived": true})
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/tasks", map[string]any{"projectId": design, "name": "Ещё", "parentId": parent.ID}),
		http.StatusConflict, "TASK_ARCHIVED")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+alone.ID+"/parent", map[string]any{"parentId": parent.ID}),
		http.StatusConflict, "TASK_ARCHIVED")
	requireEvents(t, s, alone.ID, "created by admin@example.com")
}

// Attaching and detaching write parent_changed with the parent keys; the same value writes nothing.
// A move or a delete detaches the subtasks, each with an event (ADR-0036).
func TestChangeParent(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	parent := createTask(t, s, design, "Форма", "")
	sub := createTask(t, s, design, "Поля", "")
	path := "/v1/tasks/" + sub.ID + "/parent"
	created := "created by admin@example.com"
	attached := "parent_changed by admin@example.com -→" + parent.Key
	detached := "parent_changed by admin@example.com " + parent.Key + "→-"

	if got := changeTask(t, s, path, map[string]any{"parentId": parent.ID}); got.ParentID == nil || *got.ParentID != parent.ID {
		t.Fatalf("attach: %+v", got)
	}
	changeTask(t, s, path, map[string]any{"parentId": parent.ID})
	requireEvents(t, s, sub.ID, attached, created)
	if got := changeTask(t, s, path, map[string]any{"parentId": nil}); got.ParentID != nil {
		t.Fatalf("detach: %+v", got)
	}
	changeTask(t, s, path, map[string]any{"parentId": nil})
	requireEvents(t, s, sub.ID, detached, attached, created)

	// A subtask moved to another project leaves its parent
	changeTask(t, s, path, map[string]any{"parentId": parent.ID})
	moved := changeTask(t, s, "/v1/tasks/"+sub.ID+"/project", map[string]any{"projectId": backend})
	if moved.ParentID != nil {
		t.Fatalf("moved subtask: %+v", moved)
	}
	requireEvents(t, s, sub.ID, detached, "moved by admin@example.com "+sub.Key+"→"+moved.Key, attached, detached, attached, created)
	if got := getTask(t, s, parent.ID); got.SubtasksTotal != 0 {
		t.Fatalf("parent after the move: %+v", got)
	}

	// A moved parent keeps no subtasks: they stay in their project
	child := createSubtask(t, s, design, parent.ID, "Кнопка")
	movedParent := changeTask(t, s, "/v1/tasks/"+parent.ID+"/project", map[string]any{"projectId": backend})
	if movedParent.SubtasksTotal != 0 {
		t.Fatalf("moved parent: %+v", movedParent)
	}
	if got := getTask(t, s, child.ID); got.ParentID != nil || got.ProjectID != design {
		t.Fatalf("subtask of a moved parent: %+v", got)
	}
	requireEvents(t, s, child.ID, detached, created)

	// A deleted parent leaves its subtasks
	other := createTask(t, s, design, "Таблица", "")
	orphan := createSubtask(t, s, design, other.ID, "Колонки")
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/tasks/"+other.ID, nil), http.StatusNoContent)
	if got := getTask(t, s, orphan.ID); got.ParentID != nil {
		t.Fatalf("subtask of a deleted parent: %+v", got)
	}
	requireEvents(t, s, orphan.ID, "parent_changed by admin@example.com "+other.Key+"→-", created)
}
