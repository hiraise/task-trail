//go:build integration

package persistent

import (
	"context"
	"fmt"
	"task-trail/internal/usecase/dto"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/require"
)

func TestTxSuccess(t *testing.T) {
	cleanDB(t)
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		// add new user in tx
		id, err := userRepo.Create(ctx, &dto.UserCreate{Email: testEmail, PasswordHash: "123"})
		require.NoError(t, err)
		require.Equal(t, 1, id)
		// check if new user was added
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 1)
		id, err = userRepo.Create(ctx, &dto.UserCreate{Email: testEmail1, PasswordHash: "123"})
		require.NoError(t, err)
		require.Equal(t, 2, id)
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 2)
		return nil
	},
	)
	// check if the transaction was committed
	verifyUsersCount(t, t.Context(), pg.Pool, 2)
}

func TestTxSuccessRollback(t *testing.T) {
	cleanDB(t)
	d := dto.UserCreate{Email: testEmail, PasswordHash: "123"}
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		// add new user in tx
		id, err := userRepo.Create(ctx, &d)
		require.NoError(t, err)
		require.Equal(t, 1, id)
		// check if new user was added
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 1)
		// return error from tx function
		id, err = userRepo.Create(ctx, &d)
		return err
	},
	)
	// check if the transaction was rolled back
	verifyUsersCount(t, t.Context(), pg.Pool, 0)
}

func TestTxFailedRollback(t *testing.T) {
	ctx := t.Context()
	cleanDB(t)

	err := txManager.DoWithTx(ctx, func(ctx context.Context) error {
		tx, _ := ctx.Value(txKey{}).(*pgx.Tx)
		(*tx).Commit(ctx)
		return fmt.Errorf("kek")
	})
	require.ErrorIs(t, err, pgx.ErrTxClosed)
}
