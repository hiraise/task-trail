package repo

import (
	"context"
	"task-trail/internal/entity"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgUserRepository struct {
	pg *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *PgUserRepository {
	return &PgUserRepository{pg: db}
}

func (r *PgUserRepository) getDb(ctx context.Context) pgConn {
	if tx := extractTx(ctx); tx != nil {
		return *tx
	}
	return r.pg
}

func (r *PgUserRepository) Create(ctx context.Context, user *entity.User) error {

	_, err := r.getDb(ctx).Exec(ctx, `INSERT INTO users (email, password_hash)
	VALUES ($1, $2)`, user.Email, user.PasswordHash)
	if err != nil {
		return err
	}
	return nil
}
