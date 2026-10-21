package persistent

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGPasswordResetRepository struct {
	PgRepository
}

func NewPasswordResetRepo(db *pgxpool.Pool) *PGPasswordResetRepository {
	return &PGPasswordResetRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGPasswordResetRepository) Create(ctx context.Context, reset *entity.PasswordReset) error {
	return r.insert(ctx, "password_resets", map[string]any{
		"token_hash": []byte(reset.TokenHash),
		"user_id":    reset.UserID,
		"expired_at": reset.ExpiredAt,
		"created_at": reset.CreatedAt,
	})
}

func (r *PGPasswordResetRepository) GetForUpdate(ctx context.Context, hash entity.LinkTokenHash) (*entity.PasswordReset, error) {
	query := `
		SELECT user_id, expired_at, created_at
		FROM password_resets
		WHERE token_hash = $1
		FOR UPDATE`
	reset := &entity.PasswordReset{TokenHash: hash}
	var userID string
	if err := r.getDb(ctx).QueryRow(ctx, query, []byte(hash)).Scan(&userID, &reset.ExpiredAt, &reset.CreatedAt); err != nil {
		return nil, r.handleError(err)
	}
	reset.UserID = entity.UserID(userID)
	return reset, nil
}

func (r *PGPasswordResetRepository) DeleteByUser(ctx context.Context, userID entity.UserID) error {
	if _, err := r.getDb(ctx).Exec(ctx, `DELETE FROM password_resets WHERE user_id = $1`, userID); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGPasswordResetRepository) DeleteExpired(ctx context.Context, now time.Time) (int64, error) {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM password_resets WHERE expired_at <= $1`, now)
	if err != nil {
		return 0, r.handleError(err)
	}
	return tag.RowsAffected(), nil
}
