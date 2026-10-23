package v1_test

import (
	"net/http"
	"net/url"
	"slices"
	"strings"
	"testing"
	"time"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type searchResult struct {
	Projects []project `json:"projects"`
	Boards   []board   `json:"boards"`
	Tasks    []task    `json:"tasks"`
}

func searchFor(t *testing.T, s *apitest.Server, q string) searchResult {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/search?q="+url.QueryEscape(q), nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[searchResult](t, rec)
}

// names lists what was found in each group: project names, board names and task keys.
func (r searchResult) names() (projects, boards, tasks []string) {
	projects, boards, tasks = []string{}, []string{}, []string{}
	for _, p := range r.Projects {
		projects = append(projects, p.Name)
	}
	for _, b := range r.Boards {
		boards = append(boards, b.Name)
	}
	for _, t := range r.Tasks {
		tasks = append(tasks, t.Key)
	}
	return projects, boards, tasks
}

// Search (ADR-0030): only what the user sees; case does not matter; % and _ are characters;
// an exact key comes first; archived items are marked.
func TestSearch(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	rec := s.Do(http.MethodPost, "/v1/projects", map[string]any{"name": "Проект Альфа", "key": "DS"})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	alpha := apitest.Decode[projectCreated](t, rec).Project.ID
	keys := make([]task, 0, 12)
	for i := range 12 {
		keys = append(keys, createTask(t, s, alpha, "Задача "+string(rune('a'+i)), ""))
	}
	createBoard(t, s, "Доска альфа", []string{alpha})
	sale := createTask(t, s, createProject(t, s, "Распродажа").Project.ID, "Скидка 50%_off", "")
	createTask(t, s, sale.ProjectID, "Скидка 500", "")

	// Ivan has his own project, board and task with the same words; he is not in the admin's projects
	signUp(t, s, createProject(t, s, "Общий").Project.ID, "ivan@example.com", "Иван")
	ivanProject := createProject(t, s, "Альфа Ивана").Project.ID
	ivanTask := createTask(t, s, ivanProject, "Альфа DS-12", "")
	createBoard(t, s, "Альфа Ивана", []string{ivanProject})
	login(t, s, "admin@example.com", password)

	projects, boards, tasks := searchFor(t, s, "  АЛЬФ ").names()
	if !slices.Equal(projects, []string{"Проект Альфа"}) || !slices.Equal(boards, []string{"Доска альфа"}) || len(tasks) != 0 {
		t.Fatalf("альф: %v %v %v", projects, boards, tasks)
	}
	if _, _, tasks := searchFor(t, session(t, s, "ivan@example.com"), "ds-12").names(); !slices.Equal(tasks, []string{ivanTask.Key}) {
		t.Fatalf("Ivan's search: %v", tasks)
	}

	// DS-1 mentions DS-12 and is updated last, yet the exact key comes first
	s.Clock.Advance(time.Minute)
	changeTask(t, s, "/v1/tasks/"+keys[0].ID, map[string]any{"description": "после DS-12"})
	if _, _, tasks := searchFor(t, s, "ds-12").names(); !slices.Equal(tasks, []string{"DS-12", "DS-1"}) {
		t.Fatalf("ds-12: %v", tasks)
	}
	if _, _, tasks := searchFor(t, s, "ds-1").names(); len(tasks) != 4 || tasks[0] != "DS-1" {
		t.Fatalf("ds-1: %v", tasks)
	}

	if _, _, tasks := searchFor(t, s, "50%_").names(); !slices.Equal(tasks, []string{sale.Key}) {
		t.Fatalf("50%%_: %v", tasks)
	}

	setArchived[task](t, s, "/v1/tasks/"+keys[1].ID, true)
	setArchived[project](t, s, "/v1/projects/"+sale.ProjectID, true)
	found := searchFor(t, s, "DS-2")
	if len(found.Tasks) != 1 || found.Tasks[0].ArchivedAt == nil {
		t.Fatalf("an archived task: %+v", found.Tasks)
	}
	found = searchFor(t, s, "распродажа")
	if len(found.Projects) != 1 || found.Projects[0].ArchivedAt == nil {
		t.Fatalf("an archived project: %+v", found.Projects)
	}
	found = searchFor(t, s, "скидка")
	if len(found.Tasks) != 2 || !found.Tasks[0].ProjectArchived || !found.Tasks[1].ProjectArchived {
		t.Fatalf("tasks of an archived project: %+v", found.Tasks)
	}

	for _, q := range []string{"", "   ", strings.Repeat("я", 101)} {
		e := apitest.RequireError(t, s.Do(http.MethodGet, "/v1/search?q="+url.QueryEscape(q), nil), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if e.Details["q"] == "" {
			t.Errorf("q %q: details %v", q, e.Details)
		}
	}
	if found := searchFor(t, s, strings.Repeat("я", 100)); len(found.Projects)+len(found.Boards)+len(found.Tasks) != 0 {
		t.Fatalf("100 characters: %+v", found)
	}
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/search", nil), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
}
