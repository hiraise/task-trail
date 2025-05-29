package persistent

import (
	"context"
	"errors"
	"task-trail/internal/repo"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type pgConn interface {
	Exec(ctx context.Context, sql string, arguments ...any) (commandTag pgconn.CommandTag, err error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type PgRepostitory struct {
	pg *pgxpool.Pool
}

func (r *PgRepostitory) getDb(ctx context.Context) pgConn {
	if tx := extractTx(ctx); tx != nil {
		return *tx
	}
	return r.pg
}

func (r *PgRepostitory) handleError(e error) error {
	if errors.Is(e, pgx.ErrNoRows) {
		return repo.Wrap(repo.ErrNotFound, e)
	}
	var pgErr *pgconn.PgError
	if errors.As(e, &pgErr) {
		if pgErr.Code == "23503" {
			return repo.Wrap(repo.ErrNotFound, e)
		}
		if pgErr.Code == "23505" {
			return repo.Wrap(repo.ErrConflict, e)
		}
	}
	return repo.Wrap(repo.ErrInternal, e)
}
