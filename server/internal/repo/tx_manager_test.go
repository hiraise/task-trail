//go:build integration

package repo

import (
	"context"
	"task-trail/internal/entity"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestTxSuccess(t *testing.T) {
	cleanDB(t)
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		// add new user in tx
		err := userRepo.Create(ctx, &entity.User{Email: "test@mail.ru", PasswordHash: "123"})
		require.NoError(t, err)
		// check if new user was added
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 1)
		err = userRepo.Create(ctx, &entity.User{Email: "test1@mail.ru", PasswordHash: "123"})
		require.NoError(t, err)
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 2)
		return nil
	},
	)
	// check if the transaction was committed
	verifyUsersCount(t, t.Context(), pg.Pool, 2)
}

func TestTxSuccessRollback(t *testing.T) {
	cleanDB(t)
	txManager.DoWithTx(t.Context(), func(ctx context.Context) error {
		// add new user in tx
		err := userRepo.Create(ctx, &entity.User{Email: "test@mail.ru", PasswordHash: "123"})
		require.NoError(t, err)
		// check if new user was added
		verifyUsersCount(t, t.Context(), (*extractTx(ctx)), 1)
		// return error from tx function
		err = userRepo.Create(ctx, &entity.User{Email: "test@mail.ru", PasswordHash: "123"})
		return err
	},
	)
	// check if the transaction was rolled back
	verifyUsersCount(t, t.Context(), pg.Pool, 0)
}
