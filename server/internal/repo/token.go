package repo

import (
	"context"
	"errors"
	"task-trail/internal/entity"

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

func (r *PgTokenRepository) Create(ctx context.Context, token entity.Token) error {
	query := `INSERT INTO refresh_tokens (id, user_id, expired_at) VALUES ($1, $2, $3)`
	_, err := r.getDb(ctx).Exec(ctx, query, token.ID, token.UserId, token.ExpiredAt)
	return err
}

func (r *PgTokenRepository) GetTokenById(
	ctx context.Context,
	tokenId string,
	userId int,
) (entity.Token, error) {
	query := `
		SELECT id, user_id, expired_at, created_at, revoked_at
		FROM refresh_tokens 
		WHERE id = $1 and user_id = $2`
	var token entity.Token
	err := r.getDb(ctx).
		QueryRow(ctx, query).
		Scan(
			&token.ID,
			&token.UserId,
			&token.ExpiredAt,
			&token.CreatedAt,
			&token.RevokedAt,
		)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return token, Wrap(ErrNotFound, err)
		}
		return token, Wrap(ErrDB, err)
	}
	return token, nil
}
