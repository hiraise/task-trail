//go:build integration

package repo

import (
	"context"
	"task-trail/internal/entity"
	"testing"

	"github.com/stretchr/testify/require"
)

func verifyUsersCount(t *testing.T, ctx context.Context, connection pgConn, c int) {
	var count int
	connection.QueryRow(ctx, "SELECT COUNT(id) FROM users").Scan(&count)
	require.Equal(t, c, count)
}

const testEmail = "test@mail.ru"
const testEmail1 = "test1@mail.ru"

var basicUser entity.User = entity.User{Email: testEmail, PasswordHash: "123"}

func TestUserCreate(t *testing.T) {
	cleanDB(t)
	t.Run("successfully create user", func(t *testing.T) {
		err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		verifyUsersCount(t, t.Context(), pg.Pool, 1)
	})
	t.Run("user alredy exists", func(t *testing.T) {
		require.ErrorIs(t, userRepo.Create(t.Context(), &basicUser), ErrConflict)
	})
	t.Run("internal database erorr", func(t *testing.T) {
		require.ErrorIs(t, userRepo.Create(getBadContext(t), &basicUser), ErrDB)
	})

}

func TestUserEmailIsTaken(t *testing.T) {
	cleanDB(t)
	t.Run("email is free", func(t *testing.T) {
		isTaken, err := userRepo.EmailIsTaken(t.Context(), testEmail)
		require.NoError(t, err)
		require.Equal(t, false, isTaken)
	})
	t.Run("email is taken", func(t *testing.T) {
		err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		isTaken, err := userRepo.EmailIsTaken(t.Context(), testEmail)
		require.NoError(t, err)
		require.Equal(t, true, isTaken)
	})
	t.Run("internal db error", func(t *testing.T) {
		isTaken, err := userRepo.EmailIsTaken(getBadContext(t), testEmail)
		require.Equal(t, false, isTaken)
		require.ErrorIs(t, err, ErrDB)

	})
}

func TestUserGetByEmail(t *testing.T) {
	cleanDB(t)
	t.Run("successfully get user", func(t *testing.T) {
		err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		user, err := userRepo.GetByEmail(t.Context(), testEmail)
		require.NoError(t, err)
		require.Equal(t, user.ID, 1)
		require.Equal(t, user.Email, testEmail)
	})
	t.Run("user not found", func(t *testing.T) {
		user, err := userRepo.GetByEmail(t.Context(), testEmail1)
		require.Nil(t, user)
		require.ErrorIs(t, err, ErrNotFound)
	})
	t.Run("internal db error", func(t *testing.T) {
		user, err := userRepo.GetByEmail(getBadContext(t), testEmail1)
		require.Nil(t, user)
		require.ErrorIs(t, err, ErrDB)
	})
}
