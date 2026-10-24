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

type notification struct {
	ID   string `json:"id"`
	Kind string `json:"kind"`
	Task struct {
		ID   string `json:"id"`
		Key  string `json:"key"`
		Name string `json:"name"`
	} `json:"task"`
	Actor        *user   `json:"actor"`
	CreatedAt    string  `json:"createdAt"`
	ReadAt       *string `json:"readAt"`
	FromStatusID *string `json:"fromStatusId"`
	ToStatusID   *string `json:"toStatusId"`
	Text         *string `json:"text"`
	DueDate      *string `json:"dueDate"`
}

func notifications(t *testing.T, s *apitest.Server) []notification {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/notifications", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[[]notification](t, rec)
}

func unread(t *testing.T, s *apitest.Server) int {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/notifications/unread-count", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[struct {
		Count int `json:"count"`
	}](t, rec).Count
}

// kinds describes notifications as "kind task-name", newest first.
func kinds(list []notification) []string {
	out := []string{}
	for _, n := range list {
		out = append(out, n.Kind+" "+n.Task.Name)
	}
	return out
}

func requireNotifications(t *testing.T, s *apitest.Server, want ...string) []notification {
	t.Helper()
	list := notifications(t, s)
	if got := kinds(list); !slices.Equal(got, want) {
		t.Fatalf("notifications:\n got %q\nwant %q", got, want)
	}
	return list
}

// The assignee hears about the assignment, the author and the assignee — about status changes
// and comments; never the actor (ADR-0038).
func TestNotificationsWritten(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	asAdmin := session(t, s, "admin@example.com")

	// Assigned at creation; assigning yourself writes nothing
	s.Clock.Advance(time.Minute)
	button := createTask(t, asAdmin, design, "Кнопка", ivan.ID)
	createTask(t, s, design, "Своя", ivan.ID)
	list := requireNotifications(t, s, "assigned Кнопка")
	if n := list[0]; n.Actor == nil || n.Actor.ID != admin.ID || n.Task.ID != button.ID || n.Task.Key != button.Key ||
		n.CreatedAt != "2026-10-21T12:01:00Z" || n.ReadAt != nil || n.Text != nil || n.FromStatusID != nil || n.DueDate != nil {
		t.Fatalf("assigned: %+v", n)
	}
	requireNotifications(t, asAdmin)

	// Ivan changes the status of the admin's task: the admin hears, Ivan does not
	s.Clock.Advance(time.Minute)
	changeTask(t, s, "/v1/tasks/"+button.ID+"/status", map[string]any{"statusId": "in_progress"})
	list = requireNotifications(t, asAdmin, "status_changed Кнопка")
	if n := list[0]; n.Actor.ID != ivan.ID || *n.FromStatusID != "open" || *n.ToStatusID != "in_progress" {
		t.Fatalf("status_changed: %+v", n)
	}

	// The admin comments: Ivan, the assignee, hears; a long comment is cut to 200 characters
	s.Clock.Advance(time.Minute)
	writeComment(t, asAdmin, button.ID, "Посмотри\n\nмакет")
	s.Clock.Advance(time.Minute)
	writeComment(t, asAdmin, button.ID, strings.Repeat("я", 1000))
	list = requireNotifications(t, s, "commented Кнопка", "commented Кнопка", "assigned Кнопка")
	if *list[1].Text != "Посмотри макет" || *list[0].Text != strings.Repeat("я", 200)+"…" || list[0].Actor.ID != admin.ID {
		t.Fatalf("commented: %q, %q", *list[1].Text, *list[0].Text)
	}
	requireNotifications(t, asAdmin, "status_changed Кнопка")

	// Reassigning writes "assigned" to the new assignee only
	changeTask(t, asAdmin, "/v1/tasks/"+button.ID+"/assignee", map[string]any{"assigneeId": nil})
	changeTask(t, asAdmin, "/v1/tasks/"+button.ID+"/assignee", map[string]any{"assigneeId": admin.ID})
	requireNotifications(t, asAdmin, "status_changed Кнопка")
	s.Clock.Advance(time.Minute)
	changeTask(t, asAdmin, "/v1/tasks/"+button.ID+"/assignee", map[string]any{"assigneeId": ivan.ID})
	requireNotifications(t, s, "assigned Кнопка", "commented Кнопка", "commented Кнопка", "assigned Кнопка")
}

// Read marks, read-all, visibility after leaving a project or deleting a task, and the cleanup
// of notifications older than 90 days (ADR-0038).
func TestNotificationsRead(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	asAdmin := session(t, s, "admin@example.com")
	signUp(t, asAdmin, backend, "olga@example.com", "Ольга")
	asAdmin.AddMember(backend, ivan.ID, "member")
	login(t, asAdmin, "admin@example.com", password)

	button := createTask(t, asAdmin, design, "Кнопка", ivan.ID)
	s.Clock.Advance(time.Minute)
	form := createTask(t, asAdmin, design, "Форма", ivan.ID)
	s.Clock.Advance(time.Minute)
	createTask(t, asAdmin, backend, "Сервер", ivan.ID)
	list := requireNotifications(t, s, "assigned Сервер", "assigned Форма", "assigned Кнопка")
	if unread(t, s) != 3 {
		t.Fatalf("unread: %d", unread(t, s))
	}

	path := "/v1/notifications/" + list[2].ID
	rec := s.Do(http.MethodPatch, path, map[string]bool{"read": true})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[notification](t, rec); got.ID != list[2].ID || got.ReadAt == nil || *got.ReadAt != "2026-10-21T12:02:00Z" || got.Actor == nil {
		t.Fatalf("read: %+v", got)
	}
	if unread(t, s) != 2 {
		t.Fatalf("unread after read: %d", unread(t, s))
	}
	rec = s.Do(http.MethodPatch, path, map[string]bool{"read": false})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[notification](t, rec); got.ReadAt != nil {
		t.Fatalf("unread: %+v", got)
	}
	if unread(t, s) != 3 {
		t.Fatalf("unread after unread: %d", unread(t, s))
	}
	apitest.RequireError(t, asAdmin.Do(http.MethodPatch, path, map[string]bool{"read": true}), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/notifications/not-a-uuid", map[string]bool{"read": true}), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodPatch, path, map[string]any{}), http.StatusUnprocessableEntity, "VALIDATION_FAILED")

	// Leaving a project and deleting a task hide their notifications
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+backend+"/leave", nil), http.StatusNoContent)
	apitest.RequireStatus(t, asAdmin.Do(http.MethodDelete, "/v1/tasks/"+form.ID, nil), http.StatusNoContent)
	requireNotifications(t, s, "assigned Кнопка")
	if unread(t, s) != 1 {
		t.Fatalf("unread after leaving: %d", unread(t, s))
	}

	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/notifications/read-all", nil), http.StatusNoContent)
	if unread(t, s) != 0 {
		t.Fatalf("unread after read-all: %d", unread(t, s))
	}
	if list := notifications(t, s); len(list) != 1 || list[0].ReadAt == nil || list[0].Task.ID != button.ID {
		t.Fatalf("after read-all: %+v", list)
	}

	// The jump expires the sessions: sign in again
	s.Clock.Advance(91 * 24 * time.Hour)
	if n, err := s.App.Notification.Cleanup.Execute(t.Context()); err != nil || n != 3 {
		t.Fatalf("cleanup: %d, %v", n, err)
	}
	login(t, s, "ivan@example.com", password)
	requireNotifications(t, s)
}

// The switch of notification emails: on by default, saved and returned in /users/me (ADR-0038).
func TestEmailNotificationsSwitch(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	if admin := registerAdmin(t, s); !admin.EmailNotifications {
		t.Fatalf("default: %+v", admin)
	}
	rec := s.Do(http.MethodPatch, "/v1/users/me/email-notifications", map[string]bool{"enabled": false})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); got.EmailNotifications {
		t.Fatalf("off: %+v", got)
	}
	if got := apitest.Decode[currentUser](t, s.Do(http.MethodGet, "/v1/users/me", nil)); got.EmailNotifications {
		t.Fatalf("me: %+v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodPatch, "/v1/users/me/email-notifications", map[string]any{}), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	rec = s.Do(http.MethodPatch, "/v1/users/me/email-notifications", map[string]bool{"enabled": true})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[currentUser](t, rec); !got.EmailNotifications {
		t.Fatalf("on: %+v", got)
	}
}

// mentionOf is the comment token of a mention (ADR-0039).
func mentionOf(name, userID string) string {
	return "@[" + name + "](" + userID + ")"
}

// A mentioned member hears "mentioned" instead of "commented"; a non-member and the writer hear
// nothing; an edit notifies only the members it adds; the email shows "@Name" (ADR-0039).
func TestNotificationMentions(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	olga := signUp(t, s, backend, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	maria := signUp(t, s, design, "maria@example.com", "Мария")
	login(t, s, "admin@example.com", password)
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	asAdmin := session(t, s, "admin@example.com")
	asMaria := session(t, s, "maria@example.com")
	smtp := withMail(s, t)

	// Maria's task, Ivan assigned; the admin mentions Ivan: he hears "mentioned", Maria — "commented"
	button := createTask(t, asMaria, design, "Кнопка", ivan.ID)
	s.Clock.Advance(time.Minute)
	first := writeComment(t, asAdmin, button.ID, "Посмотри,\n"+mentionOf("Иван", strings.ToUpper(ivan.ID)))
	list := requireNotifications(t, s, "mentioned Кнопка", "assigned Кнопка")
	if n := list[0]; n.Text == nil || *n.Text != "Посмотри, @Иван" || n.Actor == nil || n.Actor.ID != admin.ID {
		t.Fatalf("mentioned: %+v", n)
	}
	list = requireNotifications(t, asMaria, "commented Кнопка")
	if *list[0].Text != "Посмотри, @Иван" {
		t.Fatalf("commented: %q", *list[0].Text)
	}

	// A non-member's token and the writer's own are kept as written and notify nobody
	text := "Спроси " + mentionOf("Ольга", olga.ID) + " и " + mentionOf("Я", admin.ID)
	if c := writeComment(t, asAdmin, button.ID, text); c.Text != text {
		t.Fatalf("text: %q", c.Text)
	}
	requireNotifications(t, s, "commented Кнопка", "mentioned Кнопка", "assigned Кнопка")
	requireNotifications(t, asMaria, "commented Кнопка", "commented Кнопка")
	requireNotifications(t, asAdmin)
	requireNotifications(t, session(t, s, "olga@example.com"))

	// An edit adding Maria notifies her only; Ivan, kept, hears nothing new
	s.Clock.Advance(time.Minute)
	rec := asAdmin.Do(http.MethodPatch, "/v1/tasks/"+button.ID+"/comments/"+first.ID,
		map[string]string{"text": first.Text + " и " + mentionOf("Мария", maria.ID)})
	apitest.RequireStatus(t, rec, http.StatusOK)
	list = requireNotifications(t, asMaria, "mentioned Кнопка", "commented Кнопка", "commented Кнопка")
	if *list[0].Text != "Посмотри, @Иван и @Мария" || list[0].CreatedAt != "2026-10-21T12:02:00Z" {
		t.Fatalf("mentioned by an edit: %+v", list[0])
	}
	requireNotifications(t, s, "commented Кнопка", "mentioned Кнопка", "assigned Кнопка")

	// The email of "mentioned" shows the name, not the token
	s.Clock.Advance(6 * time.Minute)
	if _, err := s.App.Notification.SendEmails.Execute(t.Context()); err != nil {
		t.Fatal(err)
	}
	var found bool
	for _, m := range smtp.Messages() {
		text := m.Text(t)
		if strings.Contains(text, "@[") {
			t.Errorf("a token in the email:\n%s", text)
		}
		found = found || slices.Equal(m.To, []string{"ivan@example.com"}) && strings.Contains(text, "«Посмотри, @Иван»")
	}
	if !found {
		t.Errorf("no email to Ivan with the mention among %d", len(smtp.Messages()))
	}
}
