package v1_test

import (
	"net/http"
	"slices"
	"strings"
	"testing"
	"time"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type boardProject struct {
	ID         string  `json:"id"`
	Name       string  `json:"name"`
	Key        string  `json:"key"`
	ArchivedAt *string `json:"archivedAt"`
}

type board struct {
	ID         string         `json:"id"`
	Name       string         `json:"name"`
	OwnerID    string         `json:"ownerId"`
	CreatedAt  string         `json:"createdAt"`
	UpdatedAt  string         `json:"updatedAt"`
	Projects   []boardProject `json:"projects"`
	Members    []user         `json:"members"`
	TasksCount int            `json:"tasksCount"`
}

func (b board) projectIDs() []string {
	ids := make([]string, len(b.Projects))
	for i, p := range b.Projects {
		ids[i] = p.ID
	}
	return ids
}

func (b board) memberIDs() []string {
	ids := make([]string, len(b.Members))
	for i, m := range b.Members {
		ids[i] = m.ID
	}
	return ids
}

func createBoard(t *testing.T, s *apitest.Server, name string, projectIDs []string, memberIDs ...string) board {
	t.Helper()
	body := map[string]any{"name": name, "projectIds": projectIDs}
	if memberIDs != nil {
		body["memberIds"] = memberIDs
	}
	rec := s.Do(http.MethodPost, "/v1/boards", body)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[board](t, rec)
}

func getBoard(t *testing.T, s *apitest.Server, id string) board {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/boards/"+id, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[board](t, rec)
}

func boardTasks(t *testing.T, s *apitest.Server, id string) []string {
	t.Helper()
	return listTasks(t, s, "/v1/boards/"+id+"/tasks")
}

// boardTeam: the administrator owns the design and backend projects; Ivan is in design, Petr in backend.
// The session stays with the administrator.
func boardTeam(t *testing.T, s *apitest.Server) (admin, ivan, petr currentUser, design, backend string) {
	t.Helper()
	admin = registerAdmin(t, s)
	design = createProject(t, s, "Дизайн").Project.ID
	backend = createProject(t, s, "Бэкенд").Project.ID
	ivan = signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	petr = signUp(t, s, backend, "petr@example.com", "Пётр")
	login(t, s, "admin@example.com", password)
	return admin, ivan, petr, design, backend
}

// The creator is the owner and the first member; a member sees only the board projects where they are
// a project member; the owner changes the board, a member gets 403, a non-member — 404 (ADR-0029).
func TestBoardPermissions(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin, ivan, petr, design, backend := boardTeam(t, s)

	created := createBoard(t, s, "Релиз", []string{design, backend, design}, ivan.ID, admin.ID, ivan.ID)
	if created.OwnerID != admin.ID || created.Name != "Релиз" ||
		!slices.Equal(created.projectIDs(), []string{backend, design}) ||
		!slices.Equal(created.memberIDs(), []string{admin.ID, ivan.ID}) {
		t.Fatalf("created: %+v", created)
	}
	path := "/v1/boards/" + created.ID
	rec := s.Do(http.MethodGet, "/v1/boards", nil)
	if list := apitest.Decode[[]board](t, rec); len(list) != 1 || list[0].ID != created.ID {
		t.Fatalf("owner's boards: %+v", list)
	}

	login(t, s, "ivan@example.com", password)
	if got := getBoard(t, s, created.ID); !slices.Equal(got.projectIDs(), []string{design}) || len(got.Members) != 2 {
		t.Errorf("Ivan sees: %+v", got)
	}
	member := []struct{ method, path string }{
		{http.MethodPatch, path},
		{http.MethodPut, path + "/projects"},
		{http.MethodPost, path + "/members"},
		{http.MethodDelete, path + "/members/" + admin.ID},
		{http.MethodDelete, path},
	}
	bodies := map[string]any{
		http.MethodPatch: map[string]any{"name": "Чужая"},
		http.MethodPut:   map[string]any{"projectIds": []string{design}},
		http.MethodPost:  map[string]any{"userIds": []string{admin.ID}},
	}
	for _, r := range member {
		apitest.RequireError(t, s.Do(r.method, r.path, bodies[r.method]), http.StatusForbidden, "FORBIDDEN")
	}

	login(t, s, "petr@example.com", password)
	outsider := append(member, []struct{ method, path string }{
		{http.MethodGet, path},
		{http.MethodGet, path + "/tasks"},
		{http.MethodDelete, path + "/leave"},
	}...)
	for _, r := range outsider {
		apitest.RequireError(t, s.Do(r.method, r.path, bodies[r.method]), http.StatusNotFound, "NOT_FOUND")
	}
	if list := apitest.Decode[[]board](t, s.Do(http.MethodGet, "/v1/boards", nil)); len(list) != 0 {
		t.Fatalf("Petr's boards: %+v", list)
	}
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/boards/42", nil), http.StatusNotFound, "NOT_FOUND")

	login(t, s, "admin@example.com", password)
	s.Clock.Advance(time.Minute)
	rec = s.Do(http.MethodPatch, path, map[string]any{"name": "Релиз 2"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[board](t, rec); got.Name != "Релиз 2" || got.UpdatedAt == got.CreatedAt {
		t.Errorf("renamed: %+v", got)
	}
	rec = s.Do(http.MethodPost, path+"/members", map[string]any{"userIds": []string{petr.ID, ivan.ID}})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[board](t, rec); !slices.Equal(got.memberIDs(), []string{admin.ID, ivan.ID, petr.ID}) {
		t.Errorf("members after adding: %v", got.memberIDs())
	}
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/leave", nil), http.StatusConflict, "OWNER_CANNOT_LEAVE")
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/members/"+admin.ID, nil), http.StatusConflict, "OWNER_CANNOT_LEAVE")
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/members/"+petr.ID, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/members/"+petr.ID, nil), http.StatusNotFound, "NOT_FOUND")

	login(t, s, "ivan@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/leave", nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, path, nil), http.StatusNotFound, "NOT_FOUND")

	login(t, s, "admin@example.com", password)
	task := createTask(t, s, design, "Кнопка", "").ID
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, path, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/tasks/"+task, nil), http.StatusOK)
}

// Only the owner's projects go on a board, only people sharing a project with the owner become
// members; replacing projects keeps those the owner no longer sees (ADR-0029).
func TestBoardProjectsAndMembers(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	_, ivan, _, design, backend := boardTeam(t, s)
	// Ivan's own project: the administrator was in it and left, Olga is only there
	login(t, s, "ivan@example.com", password)
	ivanProject := createProject(t, s, "Проект Ивана").Project.ID
	olga := signUp(t, s, ivanProject, "olga@example.com", "Ольга")
	login(t, s, "ivan@example.com", password)
	addMembers(t, s, ivanProject, "admin@example.com")
	login(t, s, "admin@example.com", password)
	shared := createBoard(t, s, "Общая", []string{design, ivanProject}, ivan.ID)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+ivanProject+"/leave", nil), http.StatusNoContent)

	missing := "8f14e45f-ceea-467f-a0e6-63f2b1b0f0a1"
	for _, projects := range [][]string{{design, ivanProject}, {missing}} {
		rec := s.Do(http.MethodPost, "/v1/boards", map[string]any{"name": "Доска", "projectIds": projects})
		apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "BOARD_PROJECT_UNAVAILABLE")
		rec = s.Do(http.MethodPut, "/v1/boards/"+shared.ID+"/projects", map[string]any{"projectIds": projects})
		apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "BOARD_PROJECT_UNAVAILABLE")
	}
	rec := s.Do(http.MethodPost, "/v1/boards", map[string]any{"name": "Доска", "projectIds": []string{design}, "memberIds": []string{olga.ID}})
	apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "BOARD_MEMBER_UNAVAILABLE")
	rec = s.Do(http.MethodPost, "/v1/boards/"+shared.ID+"/members", map[string]any{"userIds": []string{missing}})
	apitest.RequireError(t, rec, http.StatusUnprocessableEntity, "BOARD_MEMBER_UNAVAILABLE")

	if got := getBoard(t, s, shared.ID); !slices.Equal(got.projectIDs(), []string{design}) {
		t.Errorf("owner after leaving the project sees: %v", got.projectIDs())
	}
	rec = s.Do(http.MethodPut, "/v1/boards/"+shared.ID+"/projects", map[string]any{"projectIds": []string{backend}})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[board](t, rec); !slices.Equal(got.projectIDs(), []string{backend}) {
		t.Errorf("owner after replacing sees: %v", got.projectIDs())
	}
	login(t, s, "ivan@example.com", password)
	if got := getBoard(t, s, shared.ID); !slices.Equal(got.projectIDs(), []string{ivanProject}) {
		t.Errorf("Ivan after replacing sees: %v", got.projectIDs())
	}
	login(t, s, "admin@example.com", password)

	validation := []struct {
		path, method string
		body         map[string]any
		field        string
	}{
		{"/v1/boards", http.MethodPost, map[string]any{"name": "", "projectIds": []string{design}}, "name"},
		{"/v1/boards", http.MethodPost, map[string]any{"name": "Доска", "projectIds": []string{}}, "projectIds"},
		{"/v1/boards", http.MethodPost, map[string]any{"name": "Доска", "projectIds": []string{"42"}}, "projectIds[0]"},
		{"/v1/boards", http.MethodPost, map[string]any{"name": strings.Repeat("д", 201), "projectIds": []string{design}}, "name"},
		{"/v1/boards/" + shared.ID, http.MethodPatch, map[string]any{"name": ""}, "name"},
		{"/v1/boards/" + shared.ID + "/members", http.MethodPost, map[string]any{"userIds": []string{}}, "userIds"},
	}
	for _, v := range validation {
		apiErr := apitest.RequireError(t, s.Do(v.method, v.path, v.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if details := apiErr.Details; details[v.field] == "" {
			t.Errorf("%s %v: details %v", v.method, v.body, details)
		}
	}
}

// Board tasks: board projects the viewer is a member of; the assignee is a board member or nobody;
// archived tasks and projects are left out; recently updated first; tasksCount matches the list.
func TestBoardTasks(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	_, ivan, petr, design, backend := boardTeam(t, s)
	b := createBoard(t, s, "Релиз", []string{design, backend}, ivan.ID)

	free := createTask(t, s, design, "Без ответственного", "").ID
	s.Clock.Advance(time.Minute)
	ivans := createTask(t, s, design, "У Ивана", ivan.ID).ID
	s.Clock.Advance(time.Minute)
	createTask(t, s, backend, "У Петра", petr.ID)
	s.Clock.Advance(time.Minute)
	api := createTask(t, s, backend, "API", "").ID
	s.Clock.Advance(time.Minute)
	archived := createTask(t, s, design, "В архиве", "").ID
	setArchived[task](t, s, "/v1/tasks/"+archived, true)
	s.Clock.Advance(time.Minute)
	changeTask(t, s, "/v1/tasks/"+free, map[string]any{"name": "Свежая"})

	if got := boardTasks(t, s, b.ID); !slices.Equal(got, []string{free, api, ivans}) {
		t.Errorf("owner's tasks: %v", got)
	}
	if got := getBoard(t, s, b.ID); got.TasksCount != 3 {
		t.Errorf("owner's tasksCount: %d", got.TasksCount)
	}

	login(t, s, "ivan@example.com", password)
	if got := boardTasks(t, s, b.ID); !slices.Equal(got, []string{free, ivans}) {
		t.Errorf("Ivan's tasks: %v", got)
	}
	rec := s.Do(http.MethodGet, "/v1/boards", nil)
	if list := apitest.Decode[[]board](t, rec); len(list) != 1 || list[0].TasksCount != 2 {
		t.Errorf("Ivan's boards: %+v", list)
	}

	login(t, s, "admin@example.com", password)
	setArchived[project](t, s, "/v1/projects/"+backend, true)
	if got := boardTasks(t, s, b.ID); !slices.Equal(got, []string{free, ivans}) {
		t.Errorf("tasks with the archived project: %v", got)
	}
	got := getBoard(t, s, b.ID)
	if got.TasksCount != 2 || len(got.Projects) != 2 || got.Projects[0].ArchivedAt == nil {
		t.Errorf("board with the archived project: %+v", got)
	}
	// Removing Ivan from the board hides his task, the task itself does not change
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/boards/"+b.ID+"/members/"+ivan.ID, nil), http.StatusNoContent)
	if got := boardTasks(t, s, b.ID); !slices.Equal(got, []string{free}) {
		t.Errorf("tasks without Ivan on the board: %v", got)
	}
	if got := apitest.Decode[task](t, s.Do(http.MethodGet, "/v1/tasks/"+ivans, nil)); got.AssigneeID == nil || *got.AssigneeID != ivan.ID {
		t.Errorf("Ivan's task: %+v", got)
	}
}
