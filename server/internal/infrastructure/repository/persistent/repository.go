package persistent

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"slices"
	"strings"
	"task-trail/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type pgConn interface {
	Exec(ctx context.Context, sql string, arguments ...any) (commandTag pgconn.CommandTag, err error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type PgRepository struct {
	pg *pgxpool.Pool
}

func (r *PgRepository) getDb(ctx context.Context) pgConn {
	if tx := extractTx(ctx); tx != nil {
		return *tx
	}
	return r.pg
}

func (r *PgRepository) handleError(e error) error {
	const skipOffset = 2
	if errors.Is(e, pgx.ErrNoRows) {
		return domain.ErrEntityNotFound(skipOffset, e)
	}
	var pgErr *pgconn.PgError
	if errors.As(e, &pgErr) {
		if pgErr.Code == "23503" {
			return domain.ErrEntityNotFound(skipOffset, e)
		}
		if pgErr.Code == "23505" {
			return domain.ErrEntityAlreadyExists(skipOffset, e)
		}
	}
	// offset is 2 to skip handleError method
	return domain.ErrRepoInternal(skipOffset, e)
}

func (r *PgRepository) insert(ctx context.Context, table string, data map[string]any) error {
	if len(data) == 0 {
		return errors.New("insert: data map is empty")
	}

	keys := slices.Sorted(maps.Keys(data))

	tableName := pgx.Identifier{table}.Sanitize()
	columns := strings.Join(keys, ", ")
	placeholders := make([]string, len(keys))
	args := make(pgx.NamedArgs, len(keys))
	for i, k := range keys {
		placeholders[i] = "@" + k
		args[k] = data[k]
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s)",
		tableName,
		columns,
		strings.Join(placeholders, ", "),
	)

	_, err := r.getDb(ctx).Exec(ctx, query, args)
	if err != nil {
		return r.handleError(err)
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
