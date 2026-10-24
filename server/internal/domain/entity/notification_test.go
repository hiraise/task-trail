package entity_test

import (
	"reflect"
	"strings"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
)

// The author and the assignee hear about a change, once each, never the actor (ADR-0038).
func TestTaskRecipients(t *testing.T) {
	anna, ivan := entity.UserID("anna"), entity.UserID("ivan")
	cases := []struct {
		name     string
		assignee *entity.UserID
		actor    entity.UserID
		want     []entity.UserID
	}{
		{"author and assignee", &ivan, "olga", []entity.UserID{anna, ivan}},
		{"the author is the assignee", &anna, "olga", []entity.UserID{anna}},
		{"the actor is excluded", &ivan, ivan, []entity.UserID{anna}},
		{"the author acts on own task", &anna, anna, nil},
		{"no assignee", nil, "olga", []entity.UserID{anna}},
	}
	for _, c := range cases {
		task := &entity.Task{AuthorID: anna, AssigneeID: c.assignee}
		if got := entity.TaskRecipients(task, c.actor); !reflect.DeepEqual(got, c.want) {
			t.Errorf("%s: %v, want %v", c.name, got, c.want)
		}
	}
}

// A comment excerpt joins whitespace into single spaces and keeps 200 runes, then "…".
func TestCommentExcerpt(t *testing.T) {
	if got := entity.CommentExcerpt("  Привет,\n\nмир\t !  "); got != "Привет, мир !" {
		t.Errorf("whitespace: %q", got)
	}
	exact := strings.Repeat("я", 200)
	if got := entity.CommentExcerpt(exact); got != exact {
		t.Errorf("200 runes are kept whole: %d runes", len([]rune(got)))
	}
	if got := entity.CommentExcerpt(exact + "ж"); got != exact+"…" {
		t.Errorf("201 runes: %q", got)
	}
}

// SetRead keeps the first read time; unread clears it.
func TestNotificationSetRead(t *testing.T) {
	n := &entity.Notification{}
	n.SetRead(true, taskTime)
	n.SetRead(true, taskTime.Add(time.Hour))
	if n.ReadAt == nil || !n.ReadAt.Equal(taskTime) {
		t.Fatalf("read: %v", n.ReadAt)
	}
	n.SetRead(false, taskTime)
	if n.ReadAt != nil {
		t.Fatalf("unread: %v", n.ReadAt)
	}
}
