package task

import (
	"bytes"
	"context"
	"net/http"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// attachments adds the uploaders to attachments.
func (f *feed) attachments(ctx context.Context, list []*entity.Attachment) ([]dto.Attachment, error) {
	ids := make([]entity.UserID, len(list))
	for i, a := range list {
		ids[i] = a.File.OwnerID
	}
	person, err := f.people(ctx, ids)
	if err != nil {
		return nil, err
	}
	out := make([]dto.Attachment, len(list))
	for i, a := range list {
		author, err := person(a.File.OwnerID)
		if err != nil {
			return nil, err
		}
		out[i] = dto.Attachment{Attachment: a, Author: author}
	}
	return out, nil
}

// ListAttachmentsService returns the task's attachments, newest first (ADR-0037).
type ListAttachmentsService struct {
	feed        *feed
	attachments repository.AttachmentRepository
}

func (s *ListAttachmentsService) Execute(ctx context.Context, userID, taskID string) ([]dto.Attachment, error) {
	task, err := s.feed.task(ctx, userID, taskID)
	if err != nil {
		return nil, err
	}
	list, err := s.attachments.ListByTask(ctx, task.ID)
	if err != nil {
		return nil, err
	}
	return s.feed.attachments(ctx, list)
}

// UploadAttachmentService attaches a file of any type up to 25 MB to a task; any member of an active
// task's project uploads (ADR-0037).
type UploadAttachmentService struct {
	editor      *editor
	feed        *feed
	attachments repository.AttachmentRepository
	files       repository.FileRepository
	factory     *factory.FileFactory
	storage     service.FileStorage
}

func (s *UploadAttachmentService) Execute(ctx context.Context, userID, taskID string, upload dto.Upload) (*dto.Attachment, error) {
	size := int64(len(upload.Content))
	if err := entity.CheckAttachment(size); err != nil {
		return nil, err
	}
	// A non-member gets ENTITY_NOT_FOUND before anything is written to disk
	if _, err := s.feed.task(ctx, userID, taskID); err != nil {
		return nil, err
	}
	// The type comes from the content, not from the request header (ADR-0013)
	file := s.factory.New(upload.Name, http.DetectContentType(upload.Content), entity.UserID(userID), size)
	// The file is written before the transaction: a slow disk does not hold the project lock
	if err := s.storage.Save(ctx, file.ID, bytes.NewReader(upload.Content)); err != nil {
		return nil, err
	}
	var attachment *entity.Attachment
	err := s.editor.commentChange(ctx, userID, taskID, func(ctx context.Context, task *entity.Task, _ *entity.ProjectMember) error {
		if err := s.files.Create(ctx, file); err != nil {
			return err
		}
		attachment = &entity.Attachment{TaskID: task.ID, File: file, CreatedAt: file.CreatedAt}
		return s.attachments.Create(ctx, attachment)
	})
	if err != nil {
		// Nobody needs the file; if it is not erased now, cleanup erases it as a file without a record (ADR-0013)
		_ = s.storage.Delete(ctx, file.ID)
		return nil, err
	}
	out, err := s.feed.attachments(ctx, []*entity.Attachment{attachment})
	if err != nil {
		return nil, err
	}
	return &out[0], nil
}

// DeleteAttachmentService removes an attachment: the uploader, the project owner or an admin deletes it.
// The file is marked deleted, cleanup erases it from disk (ADR-0013, ADR-0037).
type DeleteAttachmentService struct {
	editor      *editor
	attachments repository.AttachmentRepository
	files       repository.FileRepository
}

func (s *DeleteAttachmentService) Execute(ctx context.Context, userID, taskID, fileID string) error {
	return s.editor.commentChange(ctx, userID, taskID, func(ctx context.Context, task *entity.Task, member *entity.ProjectMember) error {
		a, err := s.attachments.Get(ctx, task.ID, entity.FileID(fileID))
		if err != nil {
			return err
		}
		if err := a.CheckDelete(member); err != nil {
			return err
		}
		if err := s.attachments.Delete(ctx, a.File.ID); err != nil {
			return err
		}
		return s.files.SoftDelete(ctx, a.File.ID, s.editor.clock.Now())
	})
}
