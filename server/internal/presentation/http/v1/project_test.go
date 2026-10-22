package v1_test

import (
	"context"
	"net/http"
	"net/url"
	"reflect"
	"slices"
	"strings"
	"testing"
	"time"

	"task-trail/test/apitest"
	"task-trail/test/contract"
	"task-trail/test/smtptest"
)

type project struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
	CreatedAt   string  `json:"createdAt"`
	TasksCount  int     `json:"tasksCount"`
	Role        string  `json:"role"`
}

type invitationResult struct {
	Email     string  `json:"email"`
	Result    string  `json:"result"`
	InviteURL *string `json:"inviteUrl"`
}

type projectCreated struct {
	Project     project            `json:"project"`
	Invitations []invitationResult `json:"invitations"`
}

type member struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	Role     string  `json:"role"`
}

// createProject creates a project as the current user.
func createProject(t *testing.T, s *apitest.Server, name string, emails ...string) projectCreated {
	t.Helper()
	body := map[string]any{"name": name}
	if emails != nil {
		body["emails"] = emails
	}
	rec := s.Do(http.MethodPost, "/v1/projects", body)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[projectCreated](t, rec)
}

// addMembers invites emails to the project as the current user.
func addMembers(t *testing.T, s *apitest.Server, projectID string, emails ...string) []invitationResult {
	t.Helper()
	rec := s.Do(http.MethodPost, "/v1/projects/"+projectID+"/members", map[string]any{"emails": emails})
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[[]invitationResult](t, rec)
}

// inviteToken is the token from an invitation link; the link leads to a web page under the service address.
func inviteToken(t *testing.T, link string) string {
	t.Helper()
	const prefix = "https://example.com/tasktrail/auth/invite?token="
	if !strings.HasPrefix(link, prefix) {
		t.Fatalf("invitation link %q", link)
	}
	u, err := url.Parse(link)
	if err != nil {
		t.Fatal(err)
	}
	return u.Query().Get("token")
}

// signUp invites email to the project as the current user (mail disabled) and accepts
// the invitation: after that the session belongs to the new user.
func signUp(t *testing.T, s *apitest.Server, projectID, email, username string) currentUser {
	t.Helper()
	results := addMembers(t, s, projectID, email)
	if len(results) != 1 || results[0].Result != "invited" || results[0].InviteURL == nil {
		t.Fatalf("invitation %s: %+v", email, results)
	}
	body := map[string]string{"token": inviteToken(t, *results[0].InviteURL), "username": username, "password": password}
	rec := s.Do(http.MethodPost, "/v1/auth/invitations/accept", body)
	apitest.RequireStatus(t, rec, http.StatusCreated)
	return apitest.Decode[currentUser](t, rec)
}

func members(t *testing.T, s *apitest.Server, projectID string) []member {
	t.Helper()
	rec := s.Do(http.MethodGet, "/v1/projects/"+projectID+"/members", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	return apitest.Decode[[]member](t, rec)
}

// The creator is the owner; the project is visible in the list and by ID, newest first; time in UTC.
func TestCreateProject(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)

	rec := s.Do(http.MethodPost, "/v1/projects", map[string]any{"name": "Дизайн-система", "description": "Компоненты и токены"})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	created := apitest.Decode[projectCreated](t, rec)
	design := created.Project
	if design.Name != "Дизайн-система" || design.Description == nil || *design.Description != "Компоненты и токены" ||
		design.Role != "owner" || design.TasksCount != 0 || design.CreatedAt != "2026-10-21T12:00:00Z" {
		t.Fatalf("project: %+v", design)
	}
	if created.Invitations == nil || len(created.Invitations) != 0 {
		t.Fatalf("invitations: %+v", created.Invitations)
	}

	s.Clock.Advance(time.Minute)
	backend := createProject(t, s, "Бэкенд").Project
	if backend.Description != nil {
		t.Fatalf("description: %v", *backend.Description)
	}
	rec = s.Do(http.MethodGet, "/v1/projects", nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	list := apitest.Decode[[]project](t, rec)
	if len(list) != 2 || list[0].ID != backend.ID || list[1].ID != design.ID || list[1].Role != "" {
		t.Fatalf("list: %+v", list)
	}
	rec = s.Do(http.MethodGet, "/v1/projects/"+design.ID, nil)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[project](t, rec); !reflect.DeepEqual(got, design) {
		t.Fatalf("by ID: %+v, on creation %+v", got, design)
	}

	anonymous(t, s)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects", nil), http.StatusUnauthorized, "UNAUTHENTICATED")
}

func TestProjectValidation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	id := createProject(t, s, "Дизайн-система").Project.ID
	many := make([]string, 51)
	for i := range many {
		many[i] = "user" + strings.Repeat("x", i) + "@example.com"
	}
	cases := []struct {
		method, path string
		body         any
		field        string
	}{
		{http.MethodPost, "/v1/projects", map[string]any{"name": ""}, "name"},
		{http.MethodPost, "/v1/projects", map[string]any{"name": strings.Repeat("я", 255)}, "name"},
		{http.MethodPost, "/v1/projects", map[string]any{"name": "Проект", "emails": []string{"ivan@example.com", "не почта"}}, "emails[1]"},
		{http.MethodPost, "/v1/projects", map[string]any{"name": "Проект", "emails": many}, "emails"},
		{http.MethodPost, "/v1/projects", map[string]any{"name": "Проект", "color": "red"}, "color"},
		{http.MethodPatch, "/v1/projects/" + id, map[string]any{}, "name"},
		{http.MethodPatch, "/v1/projects/" + id, `{"name": null}`, "name"},
		{http.MethodPatch, "/v1/projects/" + id, map[string]any{"name": ""}, "name"},
		{http.MethodPost, "/v1/projects/" + id + "/members", map[string]any{"emails": []string{}}, "emails"},
		{http.MethodPost, "/v1/projects/" + id + "/members", map[string]any{}, "emails"},
		{http.MethodPost, "/v1/projects/" + id + "/members", map[string]any{"emails": many}, "emails"},
	}
	for _, c := range cases {
		apiErr := apitest.RequireError(t, s.Do(c.method, c.path, c.body), http.StatusUnprocessableEntity, "VALIDATION_FAILED")
		if _, ok := apiErr.Details[c.field]; !ok {
			t.Errorf("%s %s %v: details lack %s: %v", c.method, c.path, c.body, c.field, apiErr.Details)
		}
	}
}

// Without mail: an existing account becomes a member at once; no account — an invitation with the link in the response;
// a repeated email in the request gets the same result (ADR-0016, ADR-0017).
func TestInviteWithoutMail(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	other := createProject(t, s, "Бэкенд").Project
	anna := signUp(t, s, other.ID, "anna@example.com", "Анна")
	login(t, s, "admin@example.com", password)

	created := createProject(t, s, "Дизайн-система", "Anna@Example.com", " New@Example.com ", "admin@example.com", "new@example.com")
	got := created.Invitations
	want := []string{"anna@example.com added", "new@example.com invited", "admin@example.com already_member", "new@example.com invited"}
	for i, r := range got {
		if i >= len(want) || r.Email+" "+r.Result != want[i] || (r.Result == "invited") != (r.InviteURL != nil) {
			t.Fatalf("results: %+v", got)
		}
	}
	if len(got) != len(want) || *got[1].InviteURL != *got[3].InviteURL {
		t.Fatalf("results: %+v", got)
	}
	design := created.Project.ID
	token := inviteToken(t, *got[1].InviteURL)
	rec := s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": token})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if info := apitest.Decode[invitationInfo](t, rec); info.ProjectName != "Дизайн-система" || info.InvitedBy != "Админ" {
		t.Fatalf("invitation: %+v", info)
	}

	// A new invitation for the same email replaces the previous one: the old link no longer works
	again := addMembers(t, s, design, "new@example.com")
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": token}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
	rec = s.Do(http.MethodPost, "/v1/auth/invitations/accept",
		map[string]string{"token": inviteToken(t, *again[0].InviteURL), "username": "Новый", "password": password})
	apitest.RequireStatus(t, rec, http.StatusCreated)
	newcomer := apitest.Decode[currentUser](t, rec)

	login(t, s, "admin@example.com", password)
	roles := map[string]string{}
	for _, m := range members(t, s, design) {
		roles[m.ID] = m.Role
	}
	if len(roles) != 3 || roles[admin.ID] != "owner" || roles[anna.ID] != "member" || roles[newcomer.ID] != "member" {
		t.Fatalf("members: %v", roles)
	}
}

// With mail the link is sent only by email; if not sent — mail_failed, the invitation stays.
// Someone added at once gets a notice email (ADR-0017).
func TestInviteWithMail(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	signUp(t, s, design, "anna@example.com", "Анна")
	login(t, s, "admin@example.com", password)
	smtp := smtptest.New(t, smtptest.WithRejected("bounce@example.com"))
	s.SaveMail(smtp.Settings())

	got := addMembers(t, s, design, "anna@example.com", "ivan@example.com", "bounce@example.com")
	want := []invitationResult{
		{Email: "anna@example.com", Result: "already_member"},
		{Email: "ivan@example.com", Result: "invited"},
		{Email: "bounce@example.com", Result: "mail_failed"},
	}
	if !slices.Equal(got, want) {
		t.Fatalf("results: %+v", got)
	}
	backend := createProject(t, s, "Бэкенд\r\nBcc: evil@example.com", "anna@example.com").Project.ID
	if n := len(smtp.Messages()); n != 2 {
		t.Fatalf("emails: %d", n)
	}
	letters := map[string]smtptest.Message{}
	for _, m := range smtp.Messages() {
		letters[m.To[0]] = m
	}
	invitation, notice := letters["ivan@example.com"], letters["anna@example.com"]
	if subject := invitation.Header(t, "Subject"); subject != "Приглашение в проект «Дизайн-система» в TaskTrail" {
		t.Errorf("invitation subject: %q", subject)
	}
	text := invitation.Text(t)
	if !strings.Contains(text, "Админ приглашает вас в проект «Дизайн-система»") || !strings.Contains(text, "действует 7 дней") {
		t.Errorf("invitation:\n%s", text)
	}
	start := strings.Index(text, "https://example.com/tasktrail/auth/invite?token=")
	if start < 0 {
		t.Fatalf("no link in the email:\n%s", text)
	}
	link, _, _ := strings.Cut(text[start:], "\n")
	rec := s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": inviteToken(t, strings.TrimSpace(link))})
	apitest.RequireStatus(t, rec, http.StatusOK)

	if subject := notice.Header(t, "Subject"); subject != "Вас добавили в проект «Бэкенд  Bcc: evil@example.com» в TaskTrail" {
		t.Errorf("notice subject: %q", subject)
	}
	if text := notice.Text(t); !strings.Contains(text, "https://example.com/tasktrail/projects/"+backend) {
		t.Errorf("notice:\n%s", text)
	}
	var invited int
	if err := s.Pool.QueryRow(context.Background(), `SELECT count(*) FROM invitations WHERE email = 'bounce@example.com'`).Scan(&invited); err != nil || invited != 1 {
		t.Fatalf("invitation without email: %d, %v", invited, err)
	}
}

// Rights by role (ADR-0003): the owner can do everything except leave; an admin manages the project and people
// with the "member" role; a member only views. For a non-member the project does not exist — 404 (ADR-0018).
func TestProjectRoles(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	p := createProject(t, s, "Дизайн-система").Project.ID
	path := "/v1/projects/" + p
	manager := signUp(t, s, p, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	worker := signUp(t, s, p, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	rec := s.Do(http.MethodPatch, path+"/members/"+manager.ID, map[string]string{"role": "admin"})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[member](t, rec); got.ID != manager.ID || got.Role != "admin" || got.Email != "olga@example.com" {
		t.Fatalf("after role change: %+v", got)
	}
	if got := members(t, s, p); len(got) != 3 || got[0].ID != admin.ID || got[0].Role != "owner" ||
		got[1].ID != manager.ID || got[1].Role != "admin" || got[2].ID != worker.ID || got[2].Role != "member" {
		t.Fatalf("members: %+v", got)
	}
	stranger := signUp(t, s, createProject(t, s, "Чужой").Project.ID, "petr@example.com", "Пётр")

	forbidden := func(method, path string, body any) {
		t.Helper()
		apitest.RequireError(t, s.Do(method, path, body), http.StatusForbidden, "FORBIDDEN")
	}
	notFound := func(method, path string, body any) {
		t.Helper()
		apitest.RequireError(t, s.Do(method, path, body), http.StatusNotFound, "NOT_FOUND")
	}
	const missing = "5f0c1b52-8d4e-4a8b-9c7e-2b1d3f4a5c6e"

	// Non-member: the project does not exist for them
	notFound(http.MethodGet, path, nil)
	notFound(http.MethodPatch, path, map[string]any{"name": "Взлом"})
	notFound(http.MethodGet, path+"/members", nil)
	notFound(http.MethodPost, path+"/members", map[string]any{"emails": []string{"x@example.com"}})
	notFound(http.MethodDelete, path+"/leave", nil)
	notFound(http.MethodDelete, path, nil)

	login(t, s, "ivan@example.com", password)
	rec = s.Do(http.MethodGet, path, nil)
	if got := apitest.Decode[project](t, rec); got.Role != "member" {
		t.Fatalf("member role: %+v", got)
	}
	forbidden(http.MethodPatch, path, map[string]any{"name": "Новое"})
	forbidden(http.MethodPost, path+"/members", map[string]any{"emails": []string{"x@example.com"}})
	forbidden(http.MethodPatch, path+"/members/"+manager.ID, map[string]string{"role": "member"})
	forbidden(http.MethodDelete, path+"/members/"+missing, nil)
	forbidden(http.MethodDelete, path, nil)
	forbidden(http.MethodGet, "/v1/projects/candidates?projectId="+p, nil)

	login(t, s, "olga@example.com", password)
	rec = s.Do(http.MethodPatch, path, `{"name": "Дизайн-система 2", "description": null}`)
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[project](t, rec); got.Name != "Дизайн-система 2" || got.Description != nil || got.Role != "admin" {
		t.Fatalf("after change: %+v", got)
	}
	forbidden(http.MethodPatch, path+"/members/"+worker.ID, map[string]string{"role": "admin"})
	forbidden(http.MethodDelete, path+"/members/"+admin.ID, nil)
	forbidden(http.MethodDelete, path+"/members/"+manager.ID, nil)
	forbidden(http.MethodDelete, path, nil)
	notFound(http.MethodDelete, path+"/members/"+stranger.ID, nil)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/members/"+worker.ID, nil), http.StatusNoContent)

	login(t, s, "admin@example.com", password)
	forbidden(http.MethodPatch, path+"/members/"+admin.ID, map[string]string{"role": "admin"})
	forbidden(http.MethodDelete, path+"/members/"+admin.ID, nil)
	apitest.RequireError(t, s.Do(http.MethodPatch, path+"/members/"+manager.ID, map[string]string{"role": "owner"}),
		http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	notFound(http.MethodPatch, path+"/members/"+missing, map[string]string{"role": "admin"})
	notFound(http.MethodPatch, path+"/members/not-a-uuid", map[string]string{"role": "admin"})
	notFound(http.MethodGet, "/v1/projects/not-a-uuid", nil)
	apitest.RequireError(t, s.Do(http.MethodDelete, path+"/leave", nil), http.StatusConflict, "OWNER_CANNOT_LEAVE")
	apitest.RequireStatus(t, s.Do(http.MethodDelete, path+"/members/"+manager.ID, nil), http.StatusNoContent)
	if got := members(t, s, p); len(got) != 1 || got[0].ID != admin.ID {
		t.Fatalf("after removal: %+v", got)
	}
}

// A removed or departed member is no longer the assignee of the project's tasks; tasks in other
// projects do not change.
func TestLeaveUnassignsTasks(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	ctx := context.Background()
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	addMembers(t, s, backend, "ivan@example.com")
	tasks := []string{createTask(t, s, design, "Кнопка", ivan.ID).ID, createTask(t, s, backend, "API", ivan.ID).ID}
	assignee := func(task string) *string {
		t.Helper()
		var id *string
		if err := s.Pool.QueryRow(ctx, `SELECT assignee_id FROM tasks WHERE id = $1`, task).Scan(&id); err != nil {
			t.Fatal(err)
		}
		return id
	}

	login(t, s, "ivan@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+design+"/leave", nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects/"+design, nil), http.StatusNotFound, "NOT_FOUND")
	if assignee(tasks[0]) != nil || assignee(tasks[1]) == nil {
		t.Fatalf("assignees after leaving: %v, %v", assignee(tasks[0]), assignee(tasks[1]))
	}
	login(t, s, "admin@example.com", password)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+backend+"/members/"+ivan.ID, nil), http.StatusNoContent)
	if assignee(tasks[1]) != nil {
		t.Fatal("removed member is still the assignee")
	}
}

// Deletion is soft (ADR-0001): the project and tasks are marked, memberships kept, invitations stop working.
func TestDeleteProject(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	ctx := context.Background()
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	keep := createProject(t, s, "Бэкенд").Project.ID
	link := *addMembers(t, s, design, "ivan@example.com")[0].InviteURL
	task := createTask(t, s, design, "Кнопка", "").ID
	createTask(t, s, keep, "API", "")
	gone := createTask(t, s, keep, "Удалённая", "").ID
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/tasks/"+gone, nil), http.StatusNoContent)

	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+design, nil), http.StatusNoContent)
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects/"+design, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodDelete, "/v1/projects/"+design, nil), http.StatusNotFound, "NOT_FOUND")
	rec := s.Do(http.MethodGet, "/v1/projects", nil)
	if list := apitest.Decode[[]project](t, rec); len(list) != 1 || list[0].ID != keep || list[0].TasksCount != 1 {
		t.Fatalf("list: %+v", list)
	}
	apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": inviteToken(t, link)}),
		http.StatusUnprocessableEntity, "LINK_INVALID")
	var taskDeleted, memberKept bool
	err := s.Pool.QueryRow(ctx, `SELECT
		(SELECT deleted_at IS NOT NULL FROM tasks WHERE id = $1),
		EXISTS (SELECT 1 FROM project_members WHERE project_id = $2 AND user_id = $3)`, task, design, admin.ID).Scan(&taskDeleted, &memberKept)
	if err != nil || !taskDeleted || !memberKept {
		t.Fatalf("task deleted: %v, membership kept: %v, %v", taskDeleted, memberKept, err)
	}
}

// Candidates are people from your projects except you; with projectId — also excluding its members.
func TestCandidates(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	backend := createProject(t, s, "Бэкенд").Project.ID
	old := createProject(t, s, "Старый").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	login(t, s, "admin@example.com", password)
	anna := signUp(t, s, design, "anna@example.com", "Анна")
	login(t, s, "admin@example.com", password)
	petr := signUp(t, s, backend, "petr@example.com", "Пётр")
	login(t, s, "admin@example.com", password)
	signUp(t, s, old, "olga@example.com", "Ольга")
	login(t, s, "admin@example.com", password)
	// People from a deleted project are no longer candidates (ADR-0001)
	apitest.RequireStatus(t, s.Do(http.MethodDelete, "/v1/projects/"+old, nil), http.StatusNoContent)

	candidates := func(query string) []string {
		t.Helper()
		rec := s.Do(http.MethodGet, "/v1/projects/candidates"+query, nil)
		apitest.RequireStatus(t, rec, http.StatusOK)
		var ids []string
		for _, u := range apitest.Decode[[]user](t, rec) {
			ids = append(ids, u.ID)
		}
		return ids
	}
	if got := candidates(""); !slices.Equal(got, []string{anna.ID, ivan.ID, petr.ID}) {
		t.Errorf("without project: %v", got)
	}
	if got := candidates("?projectId=" + design); !slices.Equal(got, []string{petr.ID}) {
		t.Errorf("to the design system: %v", got)
	}
	login(t, s, "ivan@example.com", password)
	if got := candidates(""); !slices.Equal(got, []string{admin.ID, anna.ID}) {
		t.Errorf("for Ivan: %v", got)
	}
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects/candidates?projectId="+design, nil), http.StatusForbidden, "FORBIDDEN")
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects/candidates?projectId="+backend, nil), http.StatusNotFound, "NOT_FOUND")
	apitest.RequireError(t, s.Do(http.MethodGet, "/v1/projects/candidates?projectId=42", nil), http.StatusNotFound, "NOT_FOUND")
}
