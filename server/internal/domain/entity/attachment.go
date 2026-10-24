package entity

import "time"

// Attachment — a file of a task (ADR-0037); the uploader is File.OwnerID.
type Attachment struct {
	TaskID    TaskID
	File      *File
	CreatedAt time.Time
}

// CheckDelete — the uploader, the project owner or a project admin deletes an attachment; by is a member
// of the attachment's task project.
func (a *Attachment) CheckDelete(by *ProjectMember) error {
	if by.UserID == a.File.OwnerID || by.Role == RoleOwner || by.Role == RoleAdmin {
		return nil
	}
	return by.forbidden("only the uploader, the owner or an admin deletes an attachment", "fileID", a.File.ID)
}
