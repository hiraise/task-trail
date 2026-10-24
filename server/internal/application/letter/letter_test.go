package letter_test

import (
	"strings"
	"testing"
	"time"

	"task-trail/internal/application/letter"
	"task-trail/internal/domain/entity"
)

func TestDuration(t *testing.T) {
	for d, want := range map[time.Duration]string{
		time.Hour:                     "1 час",
		3 * time.Hour:                 "3 часа",
		11 * time.Hour:                "11 часов",
		21 * time.Hour:                "21 час",
		24 * time.Hour:                "24 часа",
		47*time.Hour + 59*time.Minute: "47 часов",
		48 * time.Hour:                "2 дня",
		7 * 24 * time.Hour:            "7 дней",
		21 * 24 * time.Hour:           "21 день",
	} {
		if got := letter.Duration(d); got != want {
			t.Errorf("%s: %q, want %q", d, got, want)
		}
	}
}

func TestPasswordReset(t *testing.T) {
	l := letter.PasswordReset("ivan@example.com", "https://example.com/auth/reset?token=ABC", 24*time.Hour)
	if l.To != "ivan@example.com" || l.Subject == "" {
		t.Fatalf("email %+v", l)
	}
	for _, part := range []string{"ivan@example.com", "\nhttps://example.com/auth/reset?token=ABC\n", "24 часа"} {
		if !strings.Contains(l.Text, part) {
			t.Errorf("text lacks %q:\n%s", part, l.Text)
		}
	}
}

// The subject is a single header line: line breaks from the project name do not get into the email headers.
func TestProjectLetters(t *testing.T) {
	const project = "Дизайн\r\nBcc: evil@example.com"
	invitation := letter.Invitation("ivan@example.com", "Анна", project, "https://example.com/auth/invite?token=ABC", 7*24*time.Hour)
	added := letter.AddedToProject("ivan@example.com", "Анна", project, "https://example.com/projects/42")
	for _, l := range []struct{ subject, text string }{{invitation.Subject, invitation.Text}, {added.Subject, added.Text}} {
		if strings.ContainsAny(l.subject, "\r\n") || !strings.Contains(l.subject, "«Дизайн  Bcc: evil@example.com»") {
			t.Errorf("subject %q", l.subject)
		}
	}
	if !strings.Contains(invitation.Text, "Анна приглашает вас") || !strings.Contains(invitation.Text, "действует 7 дней") ||
		!strings.Contains(invitation.Text, "\nhttps://example.com/auth/invite?token=ABC\n") || invitation.To != "ivan@example.com" {
		t.Errorf("invitation:\n%s", invitation.Text)
	}
	if !strings.Contains(added.Text, "Анна добавляет вас") || !strings.Contains(added.Text, "\nhttps://example.com/projects/42\n") {
		t.Errorf("notification:\n%s", added.Text)
	}
}

func TestMailTest(t *testing.T) {
	l := letter.MailTest("admin@example.com")
	if l.To != "admin@example.com" || l.Subject == "" || !strings.Contains(l.Text, "тестовое письмо") {
		t.Fatalf("email %+v", l)
	}
}

// Every kind names what happened in the subject and the text; comments carry their start; the subject
// stays one line.
func TestTaskNotification(t *testing.T) {
	base := letter.TaskNotificationData{
		TaskKey: "DS-7", TaskName: "Кнопка", Actor: "Анна",
		TaskURL: "https://example.com/tasks/7", ProfileURL: "https://example.com/profile",
	}
	for _, c := range []struct {
		kind              entity.NotificationKind
		change            func(*letter.TaskNotificationData)
		subject, textPart string
	}{
		{entity.NotifyAssigned, nil, "DS-7: Анна назначил(а) вас ответственным", ""},
		{entity.NotifyStatusChanged, func(d *letter.TaskNotificationData) { d.FromStatus, d.ToStatus = "Открыта", "В работе" },
			"DS-7: Анна изменил(а) статус: Открыта → В работе", ""},
		{entity.NotifyCommented, func(d *letter.TaskNotificationData) { d.Text = "Посмотри макет" },
			"DS-7: Анна оставил(а) комментарий", "\n«Посмотри макет»\n"},
		{entity.NotifyMentioned, func(d *letter.TaskNotificationData) { d.Text = "@Иван глянь" },
			"DS-7: Анна упомянул(а) вас в комментарии", "\n«@Иван глянь»\n"},
		{entity.NotifyDueSoon, func(d *letter.TaskNotificationData) { d.Actor, d.DueDate = "", "22.10.2026" },
			"DS-7: Срок задачи — завтра, 22.10.2026", ""},
		{entity.NotifyOverdue, func(d *letter.TaskNotificationData) { d.Actor, d.DueDate = "", "20.10.2026" },
			"DS-7: Срок задачи прошёл 20.10.2026", ""},
	} {
		d := base
		d.Kind = c.kind
		if c.change != nil {
			c.change(&d)
		}
		l := letter.TaskNotification("ivan@example.com", d)
		if l.To != "ivan@example.com" || l.Subject != c.subject {
			t.Errorf("%s: to %q, subject %q", c.kind, l.To, l.Subject)
		}
		event := strings.TrimPrefix(c.subject, "DS-7: ")
		for _, part := range []string{"Здравствуйте!\n\n" + event + "\n", c.textPart, "\nЗадача: DS-7 Кнопка\nhttps://example.com/tasks/7\n",
			"\nПисьма об уведомлениях отключаются в профиле: https://example.com/profile\n"} {
			if !strings.Contains(l.Text, part) {
				t.Errorf("%s: text lacks %q:\n%s", c.kind, part, l.Text)
			}
		}
	}
	d := base
	d.Kind, d.TaskKey = entity.NotifyAssigned, "DS-7\r\nBcc: evil@example.com"
	if l := letter.TaskNotification("ivan@example.com", d); strings.ContainsAny(l.Subject, "\r\n") {
		t.Errorf("subject %q", l.Subject)
	}
}
