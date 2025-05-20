//go:build integration

package repo

import (
	"context"
	"task-trail/internal/entity"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

const testTokenId = "6ff51bb9-e02a-4155-9f76-bfff8c68e3ac"
const testTokenId1 = "d7e2ec56-b4cb-44eb-879b-8b6b1b2b2fb8"
const testTokenId2 = "eb660031-8825-43ca-af3a-b7191bd12e15"

var testToken entity.Token = entity.Token{ID: testTokenId, UserId: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}
var testToken1 entity.Token = entity.Token{ID: testTokenId1, UserId: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}
var testToken2 entity.Token = entity.Token{ID: testTokenId2, UserId: 1, ExpiredAt: time.Now().Add(time.Minute * 10)}

func verifyTokensCount(t *testing.T, ctx context.Context, connection pgConn, c int) {
	var count int
	connection.QueryRow(ctx, "SELECT COUNT(id) FROM refresh_tokens").Scan(&count)
	require.Equal(t, c, count)
}
func initToken(t *testing.T) {
	err := userRepo.Create(t.Context(), &basicUser)
	require.NoError(t, err)
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
		newToken.UserId = 2
		newToken.ID = testTokenId1
		err := tokenRepo.Create(t.Context(), &newToken)
		require.ErrorIs(t, err, ErrNotFound)
	})
	t.Run("token already exists", func(t *testing.T) {
		err := tokenRepo.Create(t.Context(), &testToken)
		require.ErrorIs(t, err, ErrConflict)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := tokenRepo.Create(getBadContext(t), &testToken)
		require.ErrorIs(t, err, ErrDB)
	})

}

func TestTokenGetById(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully get token by ID", func(t *testing.T) {
		token, err := tokenRepo.GetById(t.Context(), testTokenId, 1)
		require.NoError(t, err)
		require.Equal(t, token.ID, testTokenId)
		require.Equal(t, token.UserId, 1)
	})
	t.Run("token not found", func(t *testing.T) {
		token, err := tokenRepo.GetById(t.Context(), testTokenId, 2)
		require.Nil(t, token)
		require.ErrorIs(t, err, ErrNotFound)
		token, err = tokenRepo.GetById(t.Context(), testTokenId1, 1)
		require.Nil(t, token)
		require.ErrorIs(t, err, ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		token, err := tokenRepo.GetById(getBadContext(t), testTokenId, 1)
		require.Nil(t, token)
		require.ErrorIs(t, err, ErrDB)
	})
}

func TestTokenRevoke(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully revoke token", func(t *testing.T) {
		token, err := tokenRepo.GetById(t.Context(), testTokenId, 1)
		require.NoError(t, err)
		require.Nil(t, token.RevokedAt)
		err = tokenRepo.Revoke(t.Context(), testTokenId)
		require.NoError(t, err)
		token, err = tokenRepo.GetById(t.Context(), testTokenId, 1)
		require.NoError(t, err)
		require.NotNil(t, token.RevokedAt)
	})
	t.Run("token not found", func(t *testing.T) {
		err := tokenRepo.Revoke(t.Context(), testTokenId1)
		require.ErrorIs(t, err, ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := tokenRepo.Revoke(getBadContext(t), testTokenId)
		require.ErrorIs(t, err, ErrDB)
	})
}

func TestTokenRevokeAllUsersTokens(t *testing.T) {
	cleanDB(t)
	initToken(t)
	t.Run("successfully revoke all user tokens", func(t *testing.T) {
		token, err := tokenRepo.GetById(t.Context(), testTokenId, 1)
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
		require.ErrorIs(t, err, ErrDB)
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
			testTokenId,
		)
		require.NoError(t, err)
		// make token2 revoked
		_, err = pg.Pool.Exec(
			t.Context(),
			`UPDATE refresh_tokens SET revoked_at = $1 WHERE id = $2`,
			time.Now().Add(time.Hour*-7*24),
			testTokenId1,
		)
		require.NoError(t, err)
		num, err := tokenRepo.DeleteRevokedAndOldTokens(t.Context(), 7)
		require.NoError(t, err)
		require.Equal(t, 2, num)
	})
	t.Run("database internal error", func(t *testing.T) {
		num, err := tokenRepo.DeleteRevokedAndOldTokens(getBadContext(t), 1)
		require.Equal(t, 0, num)
		require.ErrorIs(t, err, ErrDB)
	})
}
