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

// An unread notification is emailed 5 minutes after it was created and only once; a read one,
// one of a user with emails off and one older than a day are not (ADR-0038).
func TestNotificationEmails(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	asAdmin := session(t, s, "admin@example.com")
	smtp := withMail(s, t)
	send := func(want int64) {
		t.Helper()
		if n, err := s.App.Notification.SendEmails.Execute(t.Context()); err != nil || n != want {
			t.Fatalf("sent %d, %v; want %d", n, err, want)
		}
	}

	button := createTask(t, asAdmin, design, "Кнопка", ivan.ID)
	send(0)
	s.Clock.Advance(6 * time.Minute)
	send(1)
	msgs := smtp.Messages()
	if len(msgs) != 1 || !slices.Equal(msgs[0].To, []string{"ivan@example.com"}) {
		t.Fatalf("messages: %+v", msgs)
	}
	if subject := msgs[0].Header(t, "Subject"); !strings.HasPrefix(subject, button.Key+": ") {
		t.Errorf("subject %q", subject)
	}
	if text := msgs[0].Text(t); !strings.Contains(text, "https://example.com/tasktrail/tasks/"+button.ID) ||
		!strings.Contains(text, "https://example.com/tasktrail/profile") {
		t.Errorf("text:\n%s", text)
	}
	send(0)

	// Read before the job runs — not emailed
	createTask(t, asAdmin, design, "Форма", ivan.ID)
	apitest.RequireStatus(t, s.Do(http.MethodPost, "/v1/notifications/read-all", nil), http.StatusNoContent)
	s.Clock.Advance(6 * time.Minute)
	send(0)

	// Emails off — not emailed; on again a day later — too old
	rec := s.Do(http.MethodPatch, "/v1/users/me/email-notifications", map[string]bool{"enabled": false})
	apitest.RequireStatus(t, rec, http.StatusOK)
	createTask(t, asAdmin, design, "Поле", ivan.ID)
	s.Clock.Advance(6 * time.Minute)
	send(0)
	login(t, s, "ivan@example.com", password) // the access token lives 15 minutes
	rec = s.Do(http.MethodPatch, "/v1/users/me/email-notifications", map[string]bool{"enabled": true})
	apitest.RequireStatus(t, rec, http.StatusOK)
	s.Clock.Advance(25 * time.Hour)
	send(0)
	if n := len(smtp.Messages()); n != 1 {
		t.Fatalf("messages: %d", n)
	}
}

// Without mail the job does nothing (ADR-0017).
func TestNotificationEmailsWithoutMail(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	createTask(t, session(t, s, "admin@example.com"), design, "Кнопка", ivan.ID)
	s.Clock.Advance(6 * time.Minute)
	if n, err := s.App.Notification.SendEmails.Execute(t.Context()); err != nil || n != 0 {
		t.Fatalf("%d, %v", n, err)
	}
}

// The assignee gets due_soon the day before the due date and overdue the day after, once each;
// a resolved task gets nothing (ADR-0038).
func TestDueDateReminders(t *testing.T) {
	s := apitest.New(t, contract.Load(t))
	registerAdmin(t, s)
	design := createProject(t, s, "Дизайн-система").Project.ID
	ivan := signUp(t, s, design, "ivan@example.com", "Иван")
	asAdmin := session(t, s, "admin@example.com")
	button := createTask(t, asAdmin, design, "Кнопка", ivan.ID)
	done := createTask(t, asAdmin, design, "Готово", ivan.ID)
	for _, id := range []string{button.ID, done.ID} {
		changeTask(t, asAdmin, "/v1/tasks/"+id+"/due-date", map[string]any{"dueDate": "2026-10-22"})
	}
	changeTask(t, asAdmin, "/v1/tasks/"+done.ID+"/status", map[string]any{"statusId": "done"})
	remind := func(want int64) {
		t.Helper()
		if n, err := s.App.Notification.Remind.Execute(t.Context()); err != nil || n != want {
			t.Fatalf("reminders %d, %v; want %d", n, err, want)
		}
	}
	reminders := func() []string {
		t.Helper()
		var out []string
		for _, n := range notifications(t, s) {
			if n.Kind == "due_soon" || n.Kind == "overdue" {
				out = append(out, n.Kind+" "+n.Task.Name+" "+*n.DueDate)
			}
		}
		return out
	}

	remind(1)
	remind(0)
	if got := reminders(); !slices.Equal(got, []string{"due_soon Кнопка 2026-10-22"}) {
		t.Fatalf("due soon: %q", got)
	}

	// The jump expires the sessions: sign in again
	s.Clock.Advance(48 * time.Hour)
	remind(1)
	remind(0)
	login(t, s, "ivan@example.com", password)
	if got := reminders(); !slices.Equal(got, []string{"overdue Кнопка 2026-10-22", "due_soon Кнопка 2026-10-22"}) {
		t.Fatalf("overdue: %q", got)
	}
}
