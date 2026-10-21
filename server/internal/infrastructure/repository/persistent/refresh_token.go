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
	})
}

func (r *PGRefreshTokenRepository) Update(ctx context.Context, entity *entity.RefreshToken) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $1
		WHERE id = $2`

	tag, err := r.getDb(ctx).Exec(ctx, query, entity.RevokedAt, entity.ID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil)
	}
	return nil
}

func (r *PGRefreshTokenRepository) GetUserToken(ctx context.Context, tokenID entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error) {
	query := `
		SELECT expired_at, revoked_at
		FROM refresh_tokens 
		WHERE id = $1 AND user_id = $2
		`
	var expiredAt time.Time
	var revoked_at *time.Time

	if err := r.getDb(ctx).
		QueryRow(ctx, query, tokenID, userID).
		Scan(&expiredAt, &revoked_at); err != nil {
		return nil, r.handleError(err)
	}
	return r.factory.Restore(string(tokenID), string(userID), expiredAt, revoked_at), nil
}
