package persistent

import (
	"context"
	"task-trail/internal/usecase/dto"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgFileRepository struct {
	PgRepostitory
}

func NewFileRepo(db *pgxpool.Pool) *PgFileRepository {
	return &PgFileRepository{PgRepostitory{pg: db}}
}

func (r *PgFileRepository) Create(ctx context.Context, file *dto.FileCreate) error {
	query := `
		INSERT INTO files 
		(id, original_name, mime_type, owner_id) 
		VALUES ($1, $2, $3, $4)`
	_, err := r.getDb(ctx).Exec(ctx, query, file.ID, file.OriginalName, file.MimeType, file.OwnerID)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}
