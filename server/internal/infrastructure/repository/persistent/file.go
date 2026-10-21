package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGFileRepository struct {
	PgRepository
}

func NewFileRepo(db *pgxpool.Pool) *PGFileRepository {
	return &PGFileRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGFileRepository) Create(ctx context.Context, f *entity.File) error {
	return r.insert(ctx, "files", map[string]any{
		"id":            f.ID,
		"original_name": f.OriginalName,
		"mime_type":     f.MimeType,
		"owner_id":      f.OwnerID,
		"created_at":    f.CreatedAt,
	})
}

func (r *PGFileRepository) Get(ctx context.Context, id entity.FileID) (*entity.File, error) {
	query := `
		SELECT original_name, mime_type, owner_id, created_at
		FROM files
		WHERE id = $1 AND soft_deleted_at IS NULL AND deleted_at IS NULL`
	f := &entity.File{ID: id}
	var ownerID string
	if err := r.getDb(ctx).QueryRow(ctx, query, id).Scan(&f.OriginalName, &f.MimeType, &ownerID, &f.CreatedAt); err != nil {
		return nil, r.handleError(err)
	}
	f.OwnerID = entity.UserID(ownerID)
	return f, nil
}

func (r *PGFileRepository) SoftDelete(ctx context.Context, id entity.FileID, now time.Time) error {
	return r.mark(ctx, `UPDATE files SET soft_deleted_at = $2 WHERE id = $1 AND soft_deleted_at IS NULL`, id, now)
}

func (r *PGFileRepository) ListSoftDeleted(ctx context.Context) ([]entity.FileID, error) {
	rows, err := r.getDb(ctx).Query(ctx, `
		SELECT id FROM files
		WHERE soft_deleted_at IS NOT NULL AND deleted_at IS NULL
		ORDER BY soft_deleted_at, id`)
	if err != nil {
		return nil, r.handleError(err)
	}
	ids, err := pgx.CollectRows(rows, pgx.RowTo[entity.FileID])
	if err != nil {
		return nil, r.handleError(err)
	}
	return ids, nil
}

func (r *PGFileRepository) MarkErased(ctx context.Context, id entity.FileID, now time.Time) error {
	return r.mark(ctx, `UPDATE files SET deleted_at = $2 WHERE id = $1 AND deleted_at IS NULL`, id, now)
}

func (r *PGFileRepository) Known(ctx context.Context, ids []entity.FileID) (map[entity.FileID]bool, error) {
	known := make(map[entity.FileID]bool, len(ids))
	if len(ids) == 0 {
		return known, nil
	}
	values := make([]string, len(ids))
	for i, id := range ids {
		values[i] = string(id)
	}
	rows, err := r.getDb(ctx).Query(ctx, `SELECT id FROM files WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`, values)
	if err != nil {
		return nil, r.handleError(err)
	}
	found, err := pgx.CollectRows(rows, pgx.RowTo[entity.FileID])
	if err != nil {
		return nil, r.handleError(err)
	}
	for _, id := range found {
		known[id] = true
	}
	return known, nil
}

// mark выполняет UPDATE одного файла; файла нет или отметка уже стоит — ENTITY_NOT_FOUND.
func (r *PGFileRepository) mark(ctx context.Context, query string, id entity.FileID, now time.Time) error {
	tag, err := r.getDb(ctx).Exec(ctx, query, id, now)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "fileID", id)
	}
	return nil
}
