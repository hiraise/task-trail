//go:build integration

package persistent

import (
	"context"
	"fmt"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
	"testing"
	"time"

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
		id, err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		require.Equal(t, 1, id)
		verifyUsersCount(t, t.Context(), pg.Pool, 1)
	})
	t.Run("user alredy exists", func(t *testing.T) {
		_, err := userRepo.Create(t.Context(), &basicUser)
		require.ErrorIs(t, err, repo.ErrConflict)
	})
	t.Run("internal database erorr", func(t *testing.T) {
		_, err := userRepo.Create(getBadContext(t), &basicUser)
		require.ErrorIs(t, err, repo.ErrInternal)
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
		id, err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		require.Equal(t, 1, id)
		isTaken, err := userRepo.EmailIsTaken(t.Context(), testEmail)
		require.NoError(t, err)
		require.Equal(t, true, isTaken)
	})
	t.Run("internal db error", func(t *testing.T) {
		isTaken, err := userRepo.EmailIsTaken(getBadContext(t), testEmail)
		require.Equal(t, false, isTaken)
		require.ErrorIs(t, err, repo.ErrInternal)

	})
}

func TestUserGetByEmail(t *testing.T) {
	cleanDB(t)
	t.Run("success", func(t *testing.T) {
		id, err := userRepo.Create(t.Context(), &basicUser)
		require.NoError(t, err)
		require.Equal(t, 1, id)
		user, err := userRepo.GetByEmail(t.Context(), testEmail)
		require.NoError(t, err)
		require.Equal(t, 1, user.ID)
		require.Equal(t, user.Email, testEmail)
	})
	t.Run("user not found", func(t *testing.T) {
		user, err := userRepo.GetByEmail(t.Context(), testEmail1)
		require.Nil(t, user)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("internal db error", func(t *testing.T) {
		user, err := userRepo.GetByEmail(getBadContext(t), testEmail1)
		require.Nil(t, user)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}
func TestUserGetByID(t *testing.T) {
	cleanDB(t)
	ctx := t.Context()

	t.Run("success", func(t *testing.T) {
		id, err := userRepo.Create(ctx, &basicUser)
		require.NoError(t, err)
		require.Equal(t, 1, id)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		require.Equal(t, 1, user.ID)
	})
	t.Run("user not found", func(t *testing.T) {
		user, err := userRepo.GetByID(ctx, 2)
		require.Nil(t, user)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("internal db error", func(t *testing.T) {
		user, err := userRepo.GetByID(getBadContext(t), 1)
		require.Nil(t, user)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}
func TestUserUpdateByID(t *testing.T) {
	ctx := t.Context()
	cleanDB(t)
	id, err := userRepo.Create(ctx, &basicUser)
	require.NoError(t, err)
	require.Equal(t, 1, id)
	id, err = userRepo.Create(ctx, &entity.User{Email: "kek@kek.ru", PasswordHash: "123"})
	require.NoError(t, err)
	require.Equal(t, 2, id)

	t.Run("only password", func(t *testing.T) {
		data := entity.User{
			ID:           1,
			PasswordHash: "aboba",
		}
		err = userRepo.Update(ctx, &data)
		require.NoError(t, err)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		require.Equal(t, user.Email, testEmail)
		require.Equal(t, user.PasswordHash, data.PasswordHash)
	})
	t.Run("only verified at", func(t *testing.T) {
		tt := time.Now()
		data := entity.User{
			ID:         1,
			VerifiedAt: &tt,
		}
		err = userRepo.Update(ctx, &data)
		require.NoError(t, err)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		fmt.Println(user.VerifiedAt.Equal(*data.VerifiedAt))
		require.Equal(t, user.PasswordHash, "aboba")
		require.Equal(t, data.VerifiedAt.Unix(), user.VerifiedAt.Unix())
	})
	t.Run("only email", func(t *testing.T) {
		data := entity.User{
			ID:    1,
			Email: testEmail1,
		}
		err = userRepo.Update(ctx, &data)
		require.NoError(t, err)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		require.Equal(t, user.Email, data.Email)
		require.Equal(t, user.PasswordHash, "aboba")
	})
	t.Run("all fields", func(t *testing.T) {
		tt := time.Now()
		data := entity.User{
			ID:           1,
			Email:        testEmail,
			PasswordHash: "123",
			VerifiedAt:   &tt,
		}
		err = userRepo.Update(ctx, &data)
		require.NoError(t, err)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		require.Equal(t, user.Email, data.Email)
		require.Equal(t, user.PasswordHash, data.PasswordHash)
		require.Equal(t, data.VerifiedAt.Unix(), user.VerifiedAt.Unix())
	})
	t.Run("no fields", func(t *testing.T) {
		data := entity.User{
			ID: 1,
		}
		err = userRepo.Update(ctx, &data)
		require.NoError(t, err)
		user, err := userRepo.GetByID(ctx, 1)
		require.NoError(t, err)
		require.Equal(t, user.Email, testEmail)
		require.Equal(t, user.PasswordHash, "123")
	})

	t.Run("user not found", func(t *testing.T) {
		data := entity.User{
			ID:    3,
			Email: testEmail,
		}
		err = userRepo.Update(ctx, &data)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		data := entity.User{
			ID:    2,
			Email: testEmail,
		}
		err = userRepo.Update(getBadContext(t), &data)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
	t.Run("email already used", func(t *testing.T) {
		data := entity.User{
			ID:    2,
			Email: testEmail,
		}
		err = userRepo.Update(ctx, &data)
		require.ErrorIs(t, err, repo.ErrConflict)
	})

}
