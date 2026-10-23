package persistent

import (
	"context"
	"errors"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGAttachmentRepository struct {
	PgRepository
}

func NewAttachmentRepo(db *pgxpool.Pool) *PGAttachmentRepository {
	return &PGAttachmentRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGAttachmentRepository) Create(ctx context.Context, a *entity.Attachment) error {
	return r.insert(ctx, "task_attachments", map[string]any{
		"file_id":    a.File.ID,
		"task_id":    a.TaskID,
		"created_at": a.CreatedAt,
	})
}

// attachmentSelect — attachments with their files; a file marked deleted is not an attachment any more.
const attachmentSelect = `
	SELECT a.task_id, a.created_at, f.id, f.original_name, f.mime_type, f.owner_id, f.size, f.created_at
	FROM task_attachments a
	JOIN files f ON f.id = a.file_id
	WHERE f.soft_deleted_at IS NULL AND f.deleted_at IS NULL`

func (r *PGAttachmentRepository) ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.Attachment, error) {
	rows, err := r.getDb(ctx).Query(ctx, attachmentSelect+` AND a.task_id = $1 ORDER BY a.created_at DESC, a.file_id`, taskID)
	if err != nil {
		return nil, r.handleError(err)
	}
	list, err := ScanRows(rows, func(row pgx.Rows) (*entity.Attachment, error) { return scanAttachment(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return list, nil
}

func (r *PGAttachmentRepository) Get(ctx context.Context, taskID entity.TaskID, fileID entity.FileID) (*entity.Attachment, error) {
	a, err := scanAttachment(r.getDb(ctx).QueryRow(ctx, attachmentSelect+` AND a.task_id = $1 AND a.file_id = $2`, taskID, fileID))
	if err != nil {
		return nil, r.handleError(err)
	}
	return a, nil
}

func (r *PGAttachmentRepository) Delete(ctx context.Context, fileID entity.FileID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM task_attachments WHERE file_id = $1`, fileID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "fileID", fileID)
	}
	return nil
}

func (r *PGAttachmentRepository) TaskOf(ctx context.Context, fileID entity.FileID) (*entity.TaskID, error) {
	var taskID string
	err := r.getDb(ctx).QueryRow(ctx, `SELECT task_id FROM task_attachments WHERE file_id = $1`, fileID).Scan(&taskID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, r.handleError(err)
	}
	id := entity.TaskID(taskID)
	return &id, nil
}

func scanAttachment(row pgx.Row) (*entity.Attachment, error) {
	var taskID, fileID, ownerID string
	a := &entity.Attachment{File: &entity.File{}}
	f := a.File
	if err := row.Scan(&taskID, &a.CreatedAt, &fileID, &f.OriginalName, &f.MimeType, &ownerID, &f.Size, &f.CreatedAt); err != nil {
		return nil, err
	}
	a.TaskID, f.ID, f.OwnerID = entity.TaskID(taskID), entity.FileID(fileID), entity.UserID(ownerID)
	return a, nil
}
