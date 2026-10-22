package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGRefreshTokenRepository struct {
	PgRepository
	factory *factory.RefreshTokenFactory
}

func NewRefreshTokenRepo(db *pgxpool.Pool, factory *factory.RefreshTokenFactory) *PGRefreshTokenRepository {
	return &PGRefreshTokenRepository{factory: factory, PgRepository: PgRepository{pg: db}}
}

func (r *PGRefreshTokenRepository) Create(ctx context.Context, entity *entity.RefreshToken) error {
	return r.insert(ctx, "refresh_tokens", map[string]any{
		"id":         entity.ID,
		"user_id":    entity.UserID,
		"expired_at": entity.ExpiredAt,
		"rotated_at": entity.RotatedAt,
		"revoked_at": entity.RevokedAt,
	})
}

func (r *PGRefreshTokenRepository) Update(ctx context.Context, entity *entity.RefreshToken) error {
	query := `
		UPDATE refresh_tokens
		SET rotated_at = $1, revoked_at = $2
		WHERE id = $3`

	tag, err := r.getDb(ctx).Exec(ctx, query, entity.RotatedAt, entity.RevokedAt, entity.ID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil)
	}
	return nil
}

func (r *PGRefreshTokenRepository) GetForUpdate(ctx context.Context, tokenID entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error) {
	query := `
		SELECT expired_at, rotated_at, revoked_at
		FROM refresh_tokens
		WHERE id = $1 AND user_id = $2
		FOR UPDATE
		`
	var expiredAt time.Time
	var rotatedAt, revokedAt *time.Time

	if err := r.getDb(ctx).
		QueryRow(ctx, query, tokenID, userID).
		Scan(&expiredAt, &rotatedAt, &revokedAt); err != nil {
		return nil, r.handleError(err)
	}
	return r.factory.Restore(string(tokenID), string(userID), expiredAt, rotatedAt, revokedAt), nil
}

func (r *PGRefreshTokenRepository) RevokeAll(ctx context.Context, userID entity.UserID, now time.Time) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $2
		WHERE user_id = $1 AND revoked_at IS NULL AND expired_at > $2`
	if _, err := r.getDb(ctx).Exec(ctx, query, userID, now); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGRefreshTokenRepository) DeleteExpired(ctx context.Context, now time.Time) (int64, error) {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM refresh_tokens WHERE expired_at <= $1`, now)
	if err != nil {
		return 0, r.handleError(err)
	}
	return tag.RowsAffected(), nil
}
