package entity

import (
	"time"

	"task-trail/internal/domain"
)

type CommentID string

// CommentEditWindow — how long after creation the author may edit a comment (ADR-0028).
const CommentEditWindow = 24 * time.Hour

// Comment — a plain-text comment on a task (ADR-0028). A deleted comment is erased at once.
type Comment struct {
	ID       CommentID
	TaskID   TaskID
	AuthorID UserID
	Text     string
	// EditedAt — when the text was last edited; nil — never edited.
	EditedAt  *time.Time
	CreatedAt time.Time
}

func NewComment(id CommentID, taskID TaskID, authorID UserID, text string, now time.Time) *Comment {
	return &Comment{ID: id, TaskID: taskID, AuthorID: authorID, Text: text, CreatedAt: now}
}

// Edit replaces the text: only the author, and only while less than CommentEditWindow has passed
// since creation — exactly 24 hours later it is already COMMENT_EDIT_EXPIRED.
func (c *Comment) Edit(by UserID, text string, now time.Time) error {
	if by != c.AuthorID {
		return domain.ErrForbidden("commentID", c.ID, "userID", by, "reason", "only the author edits a comment")
	}
	if !now.Before(c.CreatedAt.Add(CommentEditWindow)) {
		return domain.ErrCommentEditExpired("commentID", c.ID, "createdAt", c.CreatedAt)
	}
	c.Text = text
	c.EditedAt = &now
	return nil
}

// CheckDelete — the author, the project owner or a project admin deletes a comment; by is a member
// of the comment's task project.
func (c *Comment) CheckDelete(by *ProjectMember) error {
	if by.UserID == c.AuthorID || by.Role == RoleOwner || by.Role == RoleAdmin {
		return nil
	}
	return by.forbidden("only the author, the owner or an admin deletes a comment", "commentID", c.ID)
}
