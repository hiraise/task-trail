package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/test/clock"
)

// The author edits a comment only while less than 24 hours have passed: one second before — yes,
// exactly 24 hours later — COMMENT_EDIT_EXPIRED; someone else — FORBIDDEN (ADR-0028).
func TestCommentEdit(t *testing.T) {
	clk := clock.New(taskTime)
	c := entity.NewComment("c", "task", "anna", "Привет", clk.Now())

	if err := c.Edit("ivan", "Чужой", clk.Now()); !domain.HasCode(err, domain.Forbidden) {
		t.Fatalf("not the author: %v", err)
	}
	clk.Advance(entity.CommentEditWindow - time.Second)
	if err := c.Edit("anna", "Исправлено", clk.Now()); err != nil {
		t.Fatalf("a second before the window ends: %v", err)
	}
	if c.Text != "Исправлено" || c.EditedAt == nil || !c.EditedAt.Equal(clk.Now()) || !c.CreatedAt.Equal(taskTime) {
		t.Fatalf("edited comment: %+v", c)
	}
	clk.Advance(time.Second)
	if err := c.Edit("anna", "Поздно", clk.Now()); !domain.HasCode(err, domain.CommentEditExpired) {
		t.Fatalf("exactly 24 hours later: %v", err)
	}
	if c.Text != "Исправлено" {
		t.Fatalf("an expired edit changed the text: %q", c.Text)
	}
}

// The author, the project owner and a project admin delete a comment; another member — FORBIDDEN.
func TestCommentCheckDelete(t *testing.T) {
	for _, role := range roles {
		// member(role) has the user ID of the role's name
		c := entity.NewComment("c", "task", entity.UserID(role), "Привет", taskTime)
		if !allowed(t, c.CheckDelete(member(role))) {
			t.Errorf("%s cannot delete their own comment", role)
		}
	}
	other := entity.NewComment("c2", "task", "someone", "Привет", taskTime)
	for role, want := range map[entity.ProjectRole]bool{entity.RoleOwner: true, entity.RoleAdmin: true, entity.RoleMember: false} {
		if got := allowed(t, other.CheckDelete(member(role))); got != want {
			t.Errorf("%s deletes another's comment: %v, want %v", role, got, want)
		}
	}
}

func TestAttachmentCheckDelete(t *testing.T) {
	for _, role := range roles {
		// member(role) has the user ID of the role's name
		a := &entity.Attachment{TaskID: "task", File: &entity.File{ID: "f", OwnerID: entity.UserID(role)}}
		if !allowed(t, a.CheckDelete(member(role))) {
			t.Errorf("%s cannot delete their own attachment", role)
		}
	}
	other := &entity.Attachment{TaskID: "task", File: &entity.File{ID: "f2", OwnerID: "someone"}}
	for role, want := range map[entity.ProjectRole]bool{entity.RoleOwner: true, entity.RoleAdmin: true, entity.RoleMember: false} {
		if got := allowed(t, other.CheckDelete(member(role))); got != want {
			t.Errorf("%s deletes another's attachment: %v, want %v", role, got, want)
		}
	}
}
