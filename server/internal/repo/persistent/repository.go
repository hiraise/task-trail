package persistent

import (
	"context"
	"errors"
	"fmt"
	"strings"
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

func (r *PgRepostitory) updateByID(ctx context.Context, table string, id int, data map[string]any) error {
	rows := make([]string, 0, len(data))
	values := make([]any, 0, len(data)+1)
	i := 1
	for k, v := range data {
		rows = append(rows, fmt.Sprintf("%s = $%d", k, i))
		values = append(values, v)
		i++
	}
	values = append(values, id)

	query := fmt.Sprintf("UPDATE %s SET %s WHERE id = $%d AND deleted_at IS NULL;", table, strings.Join(rows, ", "), i)

	tag, err := r.getDb(ctx).Exec(ctx, query, values...)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}

func ScanRows[T any](rows pgx.Rows, f func(row pgx.Rows) (*T, error)) ([]*T, error) {
	defer rows.Close()

	var retVal []*T
	for rows.Next() {
		item, err := f(rows)
		if err != nil {
			return nil, err
		}
		retVal = append(retVal, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return retVal, nil
}
