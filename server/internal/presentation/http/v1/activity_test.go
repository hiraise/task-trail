package v1_test

import (
	"net/http"
	"reflect"
	"slices"
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type taskComment struct {
	ID        string  `json:"id"`
	TaskID    string  `json:"taskId"`
	Author    user    `json:"author"`
	Text      string  `json:"text"`
	CreatedAt string  `json:"createdAt"`
	EditedAt  *string `json:"editedAt"`
}

type taskEvent struct {
	ID           string  `json:"id"`
	TaskID       string  `json:"taskId"`
	Kind         string  `json:"kind"`
	Actor        user    `json:"actor"`
	CreatedAt    string  `json:"createdAt"`
	FromStatusID *string `json:"fromStatusId"`
	ToStatusID   *string `json:"toStatusId"`
	FromPriority *string `json:"fromPriority"`
	ToPriority   *string `json:"toPriority"`
	FromDueDate  *string `json:"fromDueDate"`
	ToDueDate    *string `json:"toDueDate"`
	FromUser     *user   `json:"fromUser"`
	ToUser       *user   `json:"toUser"`
	FromKey      *string `json:"fromKey"`
	ToKey        *string `json:"toKey"`
}

// describe renders an event for comparison: kind, actor and the change fields that are set.
func (e taskEvent) describe() string {
	out := e.Kind + " by " + e.Actor.Email
	str := func(s *string) string {
		if s == nil {
			return "-"
		}
		return *s
	}
	email := func(u *user) string {
		if u == nil {
			return "-"
		}
		return u.Email
	}
	switch {
	case e.FromStatusID != nil || e.ToStatusID != nil:
		out += " " + str(e.FromStatusID) + "→" + str(e.ToStatusID)
	case e.FromPriority != nil || e.ToPriority != nil:
		out += " " + str(e.FromPriority) + "→" + str(e.ToPriority)
	case e.FromDueDate != nil || e.ToDueDate != nil:
		out += " " + str(e.FromDueDate) + "→" + str(e.ToDueDate)
	case e.FromKey != nil || e.ToKey != nil:
		out += " " + str(e.FromKey) + "→" + str(e.ToKey)
	case e.FromUser != nil || e.ToUser != nil:
		out += " " + email(e.FromUser) + "→" + email(e.ToUser)
	}
	return out
}

func writeComment(t *testing.T, s *apitest.Server, taskID, text string) taskComment {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/tasks/"+taskID+"/comments", map[string]string{"text": text})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[taskComment](t, rec)
}

func listComments(t *testing.T, s *apitest.Server, taskID string) []taskComment {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/tasks/"+taskID+"/comments", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[[]taskComment](t, rec)
}

func commentTexts(t *testing.T, s *apitest.Server, taskID string) []string {
	t.Helper()
	texts := []string{}
	for _, c := range listComments(t, s, taskID) {
		texts = append(texts, c.Text)
	}
	return texts
}

// events — the task history as describe lines, newest first.
func events(t *testing.T, s *apitest.Server, taskID string) []string {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/tasks/"+taskID+"/events", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	out := []string{}
	for _, e := range apitest.Decode[[]taskEvent](t, rec) {
		if e.TaskID != taskID {
			t.Errorf("event of another task: %+v", e)
		}
		out = append(out, e.describe())
	}
	return out
}

func requireEvents(t *testing.T, s *apitest.Server, taskID string, want ...string) {
	t.Helper()
	if got := events(t, s, taskID); !slices.Equal(got, want) {
		t.Fatalf("events:\n got %q\nwant %q", got, want)
	}
}

// Any member writes a comment; the text is trimmed and 1–10 000 characters long; lists are newest
// first, comments written at the same time — the later first (ADR-0028).
func TestTaskComments(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	button := createTask(t, s, design, "Кнопка", "")

	s.Clock.Advance(time.Minute)
	got := writeComment(t, s, button.ID, "  Привет, https://example.com  ")
	want := taskComment{
		ID: got.ID, TaskID: button.ID, Author: user{ID: ivan.ID, Email: "ivan@example.com", Username: ptr("Иван")},
		Text: "Привет, https://example.com", CreatedAt: "2026-10-21T12:01:00Z",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("comment: %+v", got)
	}

	long := strings.Repeat("я", 10000)
	writeComment(t, s, button.ID, long)
	writeComment(t, s, button.ID, "Тоже сейчас")
	s.Clock.Advance(time.Minute)
	writeComment(t, s, button.ID, "Позже")
	if texts := commentTexts(t, s, button.ID); !slices.Equal(texts, []string{"Позже", "Тоже сейчас", long, want.Text}) {
		t.Fatalf("order: %q", texts)
	}

	for name, text := range map[string]string{"empty": "", "spaces": "   ", "too long": long + "я"} {
		rec := s.Do(http.MethodPost, "/v1/tasks/"+button.ID+"/comments", map[string]string{"text": text})
		if rec.Code != http.StatusUnprocessableEntity {
			t.Errorf("%s: %d", name, rec.Code)
		}
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/tasks/"+button.ID+"/comments", map[string]any{}),
		http.StatusUnprocessableEntity, "VALIDATION_FAILED")
}

// Only the author edits a comment, during the first 24 hours; the author, the project owner and a
// project admin delete it; a comment of another task is not found (ADR-0028).
func TestCommentEditAndDelete(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	olga := signUp(t, s, design, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodPatch, "/v1/projects/"+design+"/members/"+olga.ID, map[string]string{"role": "admin"}),
		http.StatusOK)
	signUp(t, s, design, "petr@example.com", "Пётр")
	login(t, s, "admin@example.com", password)
	signUp(t, s, design, "ivan@example.com", "Иван")
	button := createTask(t, s, design, "Кнопка", "")
	form := createTask(t, s, design, "Форма", "")
	comment := writeComment(t, s, button.ID, "Привет")
	path := "/v1/tasks/" + button.ID + "/comments/" + comment.ID

	petr := session(t, s, "petr@example.com")
	apitest.RequireError(t, petr.Do(http.MethodPatch, path, map[string]string{"text": "Чужой"}), http.StatusForbidden, "FORBIDDEN")
	apitest.RequireError(t, petr.Do(http.MethodDelete, path, nil), http.StatusForbidden, "FORBIDDEN")

	// A comment addressed through another task's path
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+form.ID+"/comments/"+comment.ID, map[string]string{"text": "Ок"}),
		http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodDelete, "/v1/tasks/"+form.ID+"/comments/"+comment.ID, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/tasks/"+button.ID+"/comments/not-a-uuid", map[string]string{"text": "Ок"}),
		http.StatusNotFound, "NOT_FOUND")

	s.Clock.Advance(entity.CommentEditWindow - time.Second)
	// The access token has expired by now
	login(t, s, "ivan@example.com", password)
	rec := s.Do(http.MethodPatch, path, map[string]string{"text": " Исправлено "})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[taskComment](t, rec); got.Text != "Исправлено" || got.EditedAt == nil ||
		*got.EditedAt != "2026-10-22T11:59:59Z" || got.CreatedAt != comment.CreatedAt {
		t.Fatalf("edited: %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodPatch, path, map[string]string{"text": ""}), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	s.Clock.Advance(time.Second)
	apitest.RequireError(t, s.Do(http.MethodPatch, path, map[string]string{"text": "Поздно"}), http.StatusConflict, "COMMENT_EDIT_EXPIRED")

	// The owner and an admin delete another's comment, the author deletes their own at any time
	second := writeComment(t, s, button.ID, "Второй")
	third := writeComment(t, s, button.ID, "Третий")
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path, nil), http.StatusNoContent)
	apitest.RequireStatus(t, session(t, s, "admin@example.com").Do(http.MethodDelete, "/v1/tasks/"+button.ID+"/comments/"+second.ID, nil),
		http.StatusNoContent)
	apitest.RequireStatus(t, session(t, s, "olga@example.com").Do(http.MethodDelete, "/v1/tasks/"+button.ID+"/comments/"+third.ID, nil),
		http.StatusNoContent)
	if texts := commentTexts(t, s, button.ID); len(texts) != 0 {
		t.Fatalf("comments left: %q", texts)
	}
	apitest.RequireError(t, s.Do(http.MethodDelete, path, nil), http.StatusNotFound, "NOT_FOUND")
}

// A non-member does not see the feed: 404; an archived task and a task of an archived project keep
// their comments read-only (ADR-0027).
func TestFeedAccessAndArchive(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	button := createTask(t, s, design, "Кнопка", "")
	comment := writeComment(t, s, button.ID, "Привет")
	path := "/v1/tasks/" + button.ID

	signUp(t, s, backend, "petr@example.com", "Пётр")
	for _, c := range []struct{ method, path string }{
		{http.MethodGet, path + "/comments"},
		{http.MethodPost, path + "/comments"},
		{http.MethodPatch, path + "/comments/" + comment.ID},
		{http.MethodDelete, path + "/comments/" + comment.ID},
		{http.MethodGet, path + "/events"},
	} {
		apitest.RequireError(t, s.Do(c.method, c.path, map[string]string{"text": "Чужой"}), http.StatusNotFound, "NOT_FOUND")
	}

	login(t, s, "admin@example.com", password)
	readOnly := func(code string) {
		t.Helper()
		apitest.RequireError(t, s.Do(http.MethodPost, path+"/comments", map[string]string{"text": "Ещё"}), http.StatusConflict, code)
		apitest.RequireError(t, s.Do(http.MethodPatch, path+"/comments/"+comment.ID, map[string]string{"text": "Ещё"}), http.StatusConflict, code)
		apitest.RequireError(t, s.Do(http.MethodDelete, path+"/comments/"+comment.ID, nil), http.StatusConflict, code)
		if texts := commentTexts(t, s, button.ID); !slices.Equal(texts, []string{"Привет"}) {
			t.Fatalf("comments: %q", texts)
		}
		events(t, s, button.ID)
	}
	setArchived[task](t, s, path, true)
	readOnly("TASK_ARCHIVED")
	setArchived[task](t, s, path, false)
	setArchived[project](t, s, "/v1/projects/"+design, true)
	readOnly("PROJECT_ARCHIVED")
}

// Every task operation writes its event with the time of the change, and nothing without a change;
// a move writes "moved" and then "assignee_changed" (ADR-0028).
func TestTaskEvents(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	designProject := createProject(t, s, "Дизайн-система").Project
	design := designProject.ID
	backendProject := createProject(t, s, "Бэкенд").Project
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	button := createTask(t, s, design, "Кнопка", ivan.ID)
	path := "/v1/tasks/" + button.ID
	admin := "admin@example.com"

	rec := s.Do(http.MethodGet, path+"/events", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	created := apitest.Decode[[]taskEvent](t, rec)
	if len(created) != 1 || created[0].Kind != "created" || created[0].CreatedAt != "2026-10-21T12:00:00Z" ||
		created[0].Actor.Email != admin || created[0].FromUser != nil || created[0].FromStatusID != nil || created[0].FromKey != nil {
		t.Fatalf("created: %+v", created)
	}

	history := []string{"created by " + admin}
	expect := func(e ...string) {
		t.Helper()
		history = append(slices.Clone(e), history...)
		requireEvents(t, s, button.ID, history...)
	}
	s.Clock.Advance(time.Minute)
	changeTask(t, s, path+"/status", map[string]any{"statusId": "open"})
	changeTask(t, s, path+"/assignee", map[string]any{"assigneeId": ivan.ID})
	changeTask(t, s, path, map[string]any{"name": "Кнопка", "description": nil})
	changeTask(t, s, path+"/project", map[string]any{"projectId": design})
	expect()

	changeTask(t, s, path+"/status", map[string]any{"statusId": "in_progress"})
	expect("status_changed by " + admin + " open→in_progress")
	s.Clock.Advance(time.Minute)
	changeTask(t, s, path, map[string]any{"name": "Кнопка входа", "description": "Основная"})
	expect("edited by " + admin)
	s.Clock.Advance(time.Minute)
	changeTask(t, s, path, map[string]any{"description": nil})
	expect("edited by " + admin)
	s.Clock.Advance(time.Minute)
	changeTask(t, s, path+"/assignee", map[string]any{"assigneeId": nil})
	expect("assignee_changed by " + admin + " ivan@example.com→-")
	s.Clock.Advance(time.Minute)
	changeTask(t, s, path+"/assignee", map[string]any{"assigneeId": ivan.ID})
	expect("assignee_changed by " + admin + " -→ivan@example.com")

	// Ivan is not a member of the backend project: the move removes him. Both events have the same
	// time; newest first, so the later written comes first
	s.Clock.Advance(time.Minute)
	moved := changeTask(t, s, path+"/project", map[string]any{"projectId": backendProject.ID})
	expect("assignee_changed by "+admin+" ivan@example.com→-", "moved by "+admin+" "+button.Key+"→"+moved.Key)
	s.Clock.Advance(time.Minute)
	setArchived[task](t, s, path, true)
	setArchived[task](t, s, path, true)
	expect("archived by " + admin)
	s.Clock.Advance(time.Minute)
	setArchived[task](t, s, path, false)
	setArchived[task](t, s, path, false)
	expect("restored by " + admin)

	rec = s.Do(http.MethodGet, path+"/events", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if latest := apitest.Decode[[]taskEvent](t, rec)[0]; latest.CreatedAt != "2026-10-21T12:08:00Z" {
		t.Fatalf("event time: %+v", latest)
	}
}

// Leaving a project and removing a member write assignee_changed for every task the person was
// unassigned from, archived ones included; the actor is whoever removed them or left. A person who
// left is still shown in the history (ADR-0028).
func TestMemberRemovalEvents(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	petr := signUp(t, s, design, "petr@example.com", "Пётр")
	login(t, s, "admin@example.com", password)
	button := createTask(t, s, design, "Кнопка", ivan.ID)
	form := createTask(t, s, design, "Форма", ivan.ID)
	other := createTask(t, s, design, "Чужая", petr.ID)
	setArchived[task](t, s, "/v1/tasks/"+form.ID, true)

	s.Clock.Advance(time.Minute)
	ivanSession := session(t, s, "ivan@example.com")
	apitest.RequireStatus(t, ivanSession.Do(http.MethodDelete, "/v1/projects/"+design+"/leave", nil), http.StatusNoContent)
	left := "assignee_changed by ivan@example.com ivan@example.com→-"
	requireEvents(t, s, button.ID, left, "created by admin@example.com")
	requireEvents(t, s, form.ID, left, "archived by admin@example.com", "created by admin@example.com")
	requireEvents(t, s, other.ID, "created by admin@example.com")

	s.Clock.Advance(time.Minute)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+design+"/members/"+petr.ID, nil), http.StatusNoContent)
	requireEvents(t, s, other.ID, "assignee_changed by admin@example.com petr@example.com→-", "created by admin@example.com")
}
