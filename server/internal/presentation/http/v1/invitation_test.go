package v1_test

import (
	"context"
	"net/http"
	"sync"
	"testing"

	"task-trail/test/apitest"
	"task-trail/test/contract"
)

type invitationInfo struct {
	Email       string `json:"email"`
	ProjectName string `json:"projectName"`
	InvitedBy   string `json:"invitedBy"`
}

func acceptBody(token string) map[string]string {
	return map[string]string{"token": token, "username": "Иван", "password": password}
}

// memberRole is the user's role in the project, or an empty string if they are not a member.
func memberRole(t *testing.T, s *apitest.Server, projectID, userID string) string {
	t.Helper()
	var role string
	err := s.Pool.QueryRow(context.Background(),
		`SELECT COALESCE((SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2), '')`, projectID, userID).Scan(&role)
	if err != nil {
		t.Fatal(err)
	}
	return role
}

// The link shows who invites and where; accepting creates an account, opens a session at once
// and turns all active invitations of the email into memberships (ADR-0016). After that links lead to sign-in.
func TestAcceptInvitation(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	design := s.CreateProject("Дизайн-система")
	backend := s.CreateProject("Бэкенд")
	token := s.Invite(design, "Ivan@Example.com", admin.ID)
	other := s.Invite(backend, "ivan@example.com", admin.ID)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/auth/logout", nil), http.StatusNoContent)

	rec := s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": token})
	apitest.RequireStatus(t, rec, http.StatusOK)
	if got := apitest.Decode[invitationInfo](t, rec); got != (invitationInfo{Email: "ivan@example.com", ProjectName: "Дизайн-система", InvitedBy: "Админ"}) {
		t.Fatalf("invitation: %+v", got)
	}

	rec = s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(token))
	apitest.RequireStatus(t, rec, http.StatusCreated)
	user := apitest.Decode[currentUser](t, rec)
	if user.Email != "ivan@example.com" || user.IsAdmin || user.Username == nil || *user.Username != "Иван" {
		t.Fatalf("user: %+v", user)
	}
	apitest.RequireStatus(t, s.Do(http.MethodGet, "/v1/auth/check", nil), http.StatusNoContent)
	for _, project := range []string{design, backend} {
		if role := memberRole(t, s, project, user.ID); role != "member" {
			t.Errorf("role in project %s: %q", project, role)
		}
	}

	for _, link := range []string{token, other} {
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": link}),
			http.StatusConflict, "INVITATION_ACCEPTED")
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(link)),
			http.StatusConflict, "INVITATION_ACCEPTED")
	}
	login(t, s, "ivan@example.com", password)
}

// An expired invitation and an invitation to a deleted project do not become memberships.
func TestAcceptInvitationSkipsInactive(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	old := s.CreateProject("Старый")
	s.Invite(old, "ivan@example.com", admin.ID)
	s.Clock.Advance(apitest.InvitationLifetime)
	deleted := s.CreateProject("Удалённый")
	s.Invite(deleted, "ivan@example.com", admin.ID)
	if _, err := s.Pool.Exec(context.Background(), `UPDATE projects SET deleted_at = now() WHERE id = $1`, deleted); err != nil {
		t.Fatal(err)
	}
	active := s.CreateProject("Действующий")
	token := s.Invite(active, "ivan@example.com", admin.ID)

	rec := s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(token))
	apitest.RequireStatus(t, rec, http.StatusCreated)
	user := apitest.Decode[currentUser](t, rec)
	for project, want := range map[string]string{old: "", deleted: "", active: "member"} {
		if role := memberRole(t, s, project, user.ID); role != want {
			t.Errorf("role in project %s: %q, expected %q", project, role, want)
		}
	}
}

func TestInvitationLinkInvalid(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	project := s.CreateProject("Дизайн-система")
	expired := s.Invite(project, "ivan@example.com", admin.ID)
	s.Clock.Advance(apitest.InvitationLifetime)

	for _, token := range []string{"unknown", expired} {
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/lookup", map[string]string{"token": token}),
			http.StatusUnprocessableEntity, "LINK_INVALID")
		apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(token)),
			http.StatusUnprocessableEntity, "LINK_INVALID")
	}
	body := apitest.RequireError(t, s.Do(http.MethodPost, "/v1/auth/invitations/accept", map[string]string{"token": expired, "password": password}),
		http.StatusUnprocessableEntity, "VALIDATION_FAILED")
	if _, ok := body.Details["username"]; !ok {
		t.Errorf("details lack username: %v", body.Details)
	}
}

// Concurrent acceptances of one link create one account; the rest lead to sign-in.
func TestAcceptInvitationRace(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	admin := registerAdmin(t, s)
	token := s.Invite(s.CreateProject("Дизайн-система"), "ivan@example.com", admin.ID)
	const attempts = 5
	codes := make(chan int, attempts)
	var wg sync.WaitGroup
	for range attempts {
		wg.Add(1)
		go func() {
			defer wg.Done()
			codes <- s.Do(http.MethodPost, "/v1/auth/invitations/accept", acceptBody(token)).Code
		}()
	}
	wg.Wait()
	close(codes)
	created := 0
	for code := range codes {
		switch code {
		case http.StatusCreated:
			created++
		case http.StatusConflict:
		default:
			t.Errorf("response %d", code)
		}
	}
	if created != 1 {
		t.Fatalf("accounts created: %d", created)
	}
}
