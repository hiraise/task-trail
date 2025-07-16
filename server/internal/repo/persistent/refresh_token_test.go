//go:build integration

package persistent

import (
	"context"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

const testTokenID = "6ff51bb9-e02a-4155-9f76-bfff8c68e3ac"
const testTokenID1 = "d7e2ec56-b4cb-44eb-879b-8b6b1b2b2fb8"
const testTokenID2 = "eb660031-8825-43ca-af3a-b7191bd12e15"

var testToken dto.RefreshTokenCreate = dto.RefreshTokenCreate{ID: testTokenID, UserID: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}
var testToken1 dto.RefreshTokenCreate = dto.RefreshTokenCreate{ID: testTokenID1, UserID: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}
var testToken2 dto.RefreshTokenCreate = dto.RefreshTokenCreate{ID: testTokenID2, UserID: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}

func verifyTokensCount(t *testing.T, ctx context.Context, connection pgConn, c int) {
	var count int
	connection.QueryRow(ctx, "SELECT COUNT(id) FROM refresh_tokens").Scan(&count)
	require.Equal(t, c, count)
}
func initToken(t *testing.T) {
	id, err := userRepo.Create(t.Context(), &basicUser)
	require.NoError(t, err)
	require.Equal(t, 1, id)
	err = tokenRepo.Create(t.Context(), &testToken)
	require.NoError(t, err)
}
func TestTokenCreate(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully create token", func(t *testing.T) {
		verifyTokensCount(t, t.Context(), pg.Pool, 1)
	})
	t.Run("user not found", func(t *testing.T) {
		newToken := testToken
		newToken.UserID = 2
		newToken.ID = testTokenID1
		err := tokenRepo.Create(t.Context(), &newToken)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("token already exists", func(t *testing.T) {
		err := tokenRepo.Create(t.Context(), &testToken)
		require.ErrorIs(t, err, repo.ErrConflict)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := tokenRepo.Create(getBadContext(t), &testToken)
		require.ErrorIs(t, err, repo.ErrInternal)
	})

}

func TestTokenGetByID(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully get token by ID", func(t *testing.T) {
		token, err := tokenRepo.GetByID(t.Context(), testTokenID, 1)
		require.NoError(t, err)
		require.Equal(t, token.ID, testTokenID)
		require.Equal(t, token.UserID, 1)
	})
	t.Run("token not found", func(t *testing.T) {
		token, err := tokenRepo.GetByID(t.Context(), testTokenID, 2)
		require.Nil(t, token)
		require.ErrorIs(t, err, repo.ErrNotFound)
		token, err = tokenRepo.GetByID(t.Context(), testTokenID1, 1)
		require.Nil(t, token)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		token, err := tokenRepo.GetByID(getBadContext(t), testTokenID, 1)
		require.Nil(t, token)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestTokenRevoke(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully revoke token", func(t *testing.T) {
		token, err := tokenRepo.GetByID(t.Context(), testTokenID, 1)
		require.NoError(t, err)
		require.Nil(t, token.RevokedAt)
		err = tokenRepo.Revoke(t.Context(), testTokenID)
		require.NoError(t, err)
		token, err = tokenRepo.GetByID(t.Context(), testTokenID, 1)
		require.NoError(t, err)
		require.NotNil(t, token.RevokedAt)
	})
	t.Run("token not found", func(t *testing.T) {
		err := tokenRepo.Revoke(t.Context(), testTokenID1)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("token already used", func(t *testing.T) {
		err := tokenRepo.Revoke(t.Context(), testTokenID)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := tokenRepo.Revoke(getBadContext(t), testTokenID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestTokenRevokeAllUsersTokens(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully revoke all user tokens", func(t *testing.T) {
		token, err := tokenRepo.GetByID(t.Context(), testTokenID, 1)
		require.NoError(t, err)
		require.Nil(t, token.RevokedAt)
		num, err := tokenRepo.RevokeAllUsersTokens(t.Context(), 1)
		require.NoError(t, err)
		require.Equal(t, 1, num)
	})
	t.Run("no tokens to revoke", func(t *testing.T) {
		num, err := tokenRepo.RevokeAllUsersTokens(t.Context(), 1)
		require.NoError(t, err)
		require.Equal(t, 0, num)
	})
	t.Run("database internal error", func(t *testing.T) {
		num, err := tokenRepo.RevokeAllUsersTokens(getBadContext(t), 1)
		require.Equal(t, 0, num)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestTokenDeleteRevokedAndOldTokens(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully delete revoked and old tokens", func(t *testing.T) {
		err := tokenRepo.Create(t.Context(), &testToken1)
		require.NoError(t, err)
		err = tokenRepo.Create(t.Context(), &testToken2)
		require.NoError(t, err)
		// make token1 is older
		_, err = pg.Pool.Exec(
			t.Context(),
			`UPDATE refresh_tokens SET expired_at = $1 WHERE id = $2`,
			time.Now().Add(time.Hour*-7*24),
			testTokenID,
		)
		require.NoError(t, err)
		// make token2 revoked
		_, err = pg.Pool.Exec(
			t.Context(),
			`UPDATE refresh_tokens SET revoked_at = $1 WHERE id = $2`,
			time.Now().Add(time.Hour*-7*24),
			testTokenID1,
		)
		require.NoError(t, err)
		num, err := tokenRepo.DeleteRevokedAndOldTokens(t.Context(), 7)
		require.NoError(t, err)
		require.Equal(t, 2, num)
	})
	t.Run("database internal error", func(t *testing.T) {
		num, err := tokenRepo.DeleteRevokedAndOldTokens(getBadContext(t), 1)
		require.Equal(t, 0, num)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}
