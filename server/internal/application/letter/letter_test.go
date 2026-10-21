package letter_test

import (
	"strings"
	"testing"
	"time"

	"task-trail/internal/application/letter"
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
			t.Errorf("%s: %q, ожидалось %q", d, got, want)
		}
	}
}

func TestPasswordReset(t *testing.T) {
	l := letter.PasswordReset("ivan@example.com", "https://example.com/auth/reset?token=ABC", 24*time.Hour)
	if l.To != "ivan@example.com" || l.Subject == "" {
		t.Fatalf("письмо %+v", l)
	}
	for _, part := range []string{"ivan@example.com", "\nhttps://example.com/auth/reset?token=ABC\n", "24 часа"} {
		if !strings.Contains(l.Text, part) {
			t.Errorf("в тексте нет %q:\n%s", part, l.Text)
		}
	}
}
