package persistent

import (
	"context"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgEmailTokenRepository struct {
	PgRepostitory
}

func NewEmailTokenRepo(db *pgxpool.Pool) *PgEmailTokenRepository {
	return &PgEmailTokenRepository{PgRepostitory{pg: db}}
}

func (r *PgEmailTokenRepository) GetByID(ctx context.Context, tokenID string) (*dto.EmailToken, error) {
	query := `
		SELECT id, user_id, purpose, created_at, expired_at, used_at   
		FROM email_tokens
		WHERE id = $1
		FOR UPDATE
	`
	var t dto.EmailToken
	if err := r.getDb(ctx).
		QueryRow(ctx, query, tokenID).
		Scan(&t.ID, &t.UserID, &t.Purpose, &t.CreatedAt, &t.ExpiredAt, &t.UsedAt); err != nil {
		return nil, r.handleError(err)
	}
	return &t, nil
}
func (r *PgEmailTokenRepository) Create(ctx context.Context, token *dto.EmailTokenCreate) error {
	query := `
		INSERT INTO email_tokens
		(id, user_id, expired_at, purpose)
		VALUES ($1, $2, $3, $4)
		`
	if _, err := r.getDb(ctx).
		Exec(ctx, query, token.ID, token.UserID, token.ExpiredAt, token.Purpose); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgEmailTokenRepository) Use(ctx context.Context, tokenID string) error {
	query := `
	UPDATE email_tokens
	SET used_at = $2
	WHERE id = $1 AND used_at IS NULL
	`
	tag, err := r.getDb(ctx).Exec(ctx, query, tokenID, time.Now())
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}

func (r *PgEmailTokenRepository) DeleteUsedAndOldTokens(ctx context.Context, olderThan int) (int, error) {
	query := `
		DELETE 
		FROM email_tokens
		WHERE
			(used_at IS NOT NULL AND used_at < NOW() - make_interval(days => $1))
			OR
			(expired_at < NOW() - make_interval(days => $1));
	`
	tag, err := r.getDb(ctx).Exec(ctx, query, olderThan)
	if err != nil {
		return 0, r.handleError(err)
	}
	return int(tag.RowsAffected()), nil
}
