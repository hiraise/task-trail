package persistent

import (
	"context"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgRefreshTokenRepository struct {
	PgRepostitory
}

func NewRefreshTokenRepo(db *pgxpool.Pool) *PgRefreshTokenRepository {
	return &PgRefreshTokenRepository{PgRepostitory{pg: db}}
}

func (r *PgRefreshTokenRepository) Create(ctx context.Context, data *dto.RefreshTokenCreate) error {
	query := `INSERT INTO refresh_tokens (id, user_id, expired_at) VALUES ($1, $2, $3)`
	_, err := r.getDb(ctx).Exec(ctx, query, data.ID, data.UserID, data.ExpiredAt)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgRefreshTokenRepository) GetByID(
	ctx context.Context,
	tokenID string,
	userID int,
) (*dto.RefreshToken, error) {
	query := `
		SELECT id, user_id, expired_at, created_at, revoked_at
		FROM refresh_tokens 
		WHERE id = $1 and user_id = $2`
	var token dto.RefreshToken
	if err := r.getDb(ctx).
		QueryRow(ctx, query, tokenID, userID).
		Scan(
			&token.ID,
			&token.UserID,
			&token.ExpiredAt,
			&token.CreatedAt,
			&token.RevokedAt,
		); err != nil {
		return nil, r.handleError(err)
	}
	return &token, nil
}

func (r *PgRefreshTokenRepository) Revoke(ctx context.Context, tokenID string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $1
		WHERE id = $2 AND revoked_at IS NULL`
	tag, err := r.getDb(ctx).Exec(ctx, query, time.Now(), tokenID)

	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}

func (r *PgRefreshTokenRepository) RevokeAllUsersTokens(ctx context.Context, userID int) (int, error) {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $1
		WHERE user_id = $2 AND revoked_at IS NULL AND expired_at >= $3`
	tag, err := r.getDb(ctx).Exec(ctx, query, time.Now(), userID, time.Now())
	if err != nil {
		return 0, r.handleError(err)
	}
	return int(tag.RowsAffected()), nil
}

func (r *PgRefreshTokenRepository) DeleteRevokedAndOldTokens(ctx context.Context, olderThan int) (int, error) {
	query := `
		DELETE 
		FROM refresh_tokens
		WHERE
			(revoked_at IS NOT NULL AND revoked_at < NOW() - make_interval(days => $1))
			OR
			(expired_at < NOW() - make_interval(days => $1));
	`
	tag, err := r.getDb(ctx).Exec(ctx, query, olderThan)
	if err != nil {
		return 0, r.handleError(err)
	}
	return int(tag.RowsAffected()), nil
}
