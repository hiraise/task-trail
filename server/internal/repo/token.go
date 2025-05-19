package repo

import (
	"context"
	"errors"
	"task-trail/internal/entity"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgTokenRepository struct {
	pg *pgxpool.Pool
}

func NewTokenRepo(db *pgxpool.Pool) *PgTokenRepository {
	return &PgTokenRepository{pg: db}
}

func (r *PgTokenRepository) getDb(ctx context.Context) pgConn {
	if tx := extractTx(ctx); tx != nil {
		return *tx
	}
	return r.pg
}

func (r *PgTokenRepository) Create(ctx context.Context, token *entity.Token) error {
	query := `INSERT INTO refresh_tokens (id, user_id, expired_at) VALUES ($1, $2, $3)`
	_, err := r.getDb(ctx).Exec(ctx, query, token.ID, token.UserId, token.ExpiredAt)
	return err
}

func (r *PgTokenRepository) GetTokenById(
	ctx context.Context,
	tokenId string,
	userId int,
) (*entity.Token, error) {
	query := `
		SELECT id, user_id, expired_at, created_at, revoked_at
		FROM refresh_tokens 
		WHERE id = $1 and user_id = $2`
	var token entity.Token
	err := r.getDb(ctx).
		QueryRow(ctx, query, tokenId, userId).
		Scan(
			&token.ID,
			&token.UserId,
			&token.ExpiredAt,
			&token.CreatedAt,
			&token.RevokedAt,
		)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, Wrap(ErrNotFound, err)
		}
		return nil, Wrap(ErrDB, err)
	}
	return &token, nil
}

func (r *PgTokenRepository) RevokeToken(ctx context.Context, tokenId string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $1
		WHERE id = $2`
	tag, err := r.getDb(ctx).Exec(ctx, query, time.Now(), tokenId)

	if err != nil {
		if tag.RowsAffected() == 0 {
			return Wrap(ErrNotFound, err)
		}
		return Wrap(ErrDB, err)
	}
	return nil
}

func (r *PgTokenRepository) RevokeAllUsersTokens(ctx context.Context, userId int) (int, error) {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $1
		WHERE user_id = $2 AND revoked_at IS NULL AND expired_at >= $3`
	tag, err := r.getDb(ctx).Exec(ctx, query, time.Now(), userId, time.Now())
	if err != nil {
		return 0, Wrap(ErrDB, err)
	}
	return int(tag.RowsAffected()), nil
}
