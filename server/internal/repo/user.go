package repo

import (
	"context"
	"fmt"
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
	query := `INSERT INTO users (email, password_hash) VALUES ($1, $2)`
	_, err := r.getDb(ctx).Exec(ctx, query, user.Email, user.PasswordHash)
	if err != nil {
		return err
	}
	return nil
}

func (r *PgUserRepository) EmailIsTaken(ctx context.Context, email string) error {
	var kek bool
	query := `SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)`
	if err := r.getDb(ctx).QueryRow(ctx, query, email).Scan(&kek); err != nil {
		return err
	}
	if kek {
		return fmt.Errorf("email already taken")
	}
	return nil
}
