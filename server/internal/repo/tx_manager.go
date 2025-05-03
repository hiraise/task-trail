package repo

import (
	"context"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgTxManager struct {
	db *pgxpool.Pool
}

func NewPgTxManager(db *pgxpool.Pool) *PgTxManager {
	return &PgTxManager{db: db}
}

func (u *PgTxManager) DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error {
	tx, err := u.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}

	if err := fn(injectTx(ctx, &tx)); err != nil {
		_ = tx.Rollback(ctx)
		return err
	}

	return tx.Commit(ctx)

}

type txKey struct{}

func injectTx(ctx context.Context, tx *pgx.Tx) context.Context {
	return context.WithValue(ctx, txKey{}, tx)
}

func extractTx(ctx context.Context) *pgx.Tx {
	if tx, ok := ctx.Value(txKey{}).(*pgx.Tx); ok {
		return tx
	}
	return nil
}
