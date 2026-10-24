package response

import (
	"time"

	"task-trail/internal/application/dto"
)

// Attachment is a task attachment (Attachment in the contract); ID is the file ID for GET /v1/files/{fileId}.
type Attachment struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"taskId"`
	Name      string    `json:"name"`
	MimeType  string    `json:"mimeType"`
	Size      int64     `json:"size"`
	Author    User      `json:"author"`
	CreatedAt time.Time `json:"createdAt"`
}

func NewAttachment(a dto.Attachment) Attachment {
	f := a.Attachment.File
	return Attachment{
		ID:        string(f.ID),
		TaskID:    string(a.Attachment.TaskID),
		Name:      f.OriginalName,
		MimeType:  f.MimeType,
		Size:      f.Size,
		Author:    NewUser(a.Author),
		CreatedAt: a.Attachment.CreatedAt.UTC(),
	}
}

func NewAttachments(list []dto.Attachment) []Attachment {
	out := make([]Attachment, len(list))
	for i, a := range list {
		out[i] = NewAttachment(a)
	}
	return out
}
