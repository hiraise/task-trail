package link_test

import (
	"testing"

	"task-trail/internal/application/link"
)

func TestLinks(t *testing.T) {
	const base = "https://example.com/tasktrail"
	for got, want := range map[string]string{
		link.Task(base, "0b8f1e4a-7c2d-4f6e-9a3b-5d1c2e7f8a90"): base + "/tasks/0b8f1e4a-7c2d-4f6e-9a3b-5d1c2e7f8a90",
		link.Profile(base):              base + "/profile",
		link.Project(base, "42"):        base + "/projects/42",
		link.PasswordReset(base, "a b"): base + "/auth/reset?token=a+b",
		link.Invitation(base, "ABC"):    base + "/auth/invite?token=ABC",
	} {
		if got != want {
			t.Errorf("%q, want %q", got, want)
		}
	}
}
