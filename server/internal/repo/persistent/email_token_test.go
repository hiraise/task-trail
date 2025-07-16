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

func beforeEachEmailTest(t *testing.T) {
	cleanDB(t)
	id, err := userRepo.Create(t.Context(), &basicUser)
	require.NoError(t, err)
	require.Equal(t, 1, id)
}

func createEmailVerificationToken(ctx context.Context, userID int, tokenID string) error {
	e := &dto.EmailTokenCreate{
		ID:        tokenID,
		ExpiredAt: time.Now().Add(time.Minute * 10),
		UserID:    userID,
		Purpose:   dto.PurposeVerification,
	}
	return emailTokenRepo.Create(ctx, e)
}
func TestCreateVerificationToken(t *testing.T) {
	ctx := t.Context()
	beforeEachEmailTest(t)

	t.Run("successfully create", func(t *testing.T) {
		err := createEmailVerificationToken(ctx, 1, testTokenID)
		require.NoError(t, err)
	})
	t.Run("already exists", func(t *testing.T) {
		err := createEmailVerificationToken(ctx, 1, testTokenID)
		require.ErrorIs(t, err, repo.ErrConflict)
	})
	t.Run("user not found", func(t *testing.T) {
		err := createEmailVerificationToken(ctx, 2, testTokenID1)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := createEmailVerificationToken(getBadContext(t), 1, testTokenID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})

}

func TestEmailTokenGetByID(t *testing.T) {
	ctx := t.Context()
	beforeEachEmailTest(t)
	err := createEmailVerificationToken(ctx, 1, testTokenID)
	require.NoError(t, err)

	t.Run("successfully get verification token by ID", func(t *testing.T) {
		token, err := emailTokenRepo.GetByID(ctx, testTokenID)
		require.NoError(t, err)
		require.Equal(t, testTokenID, token.ID)
		require.Equal(t, dto.PurposeVerification, token.Purpose)
	})
	t.Run("token not found", func(t *testing.T) {
		token, err := emailTokenRepo.GetByID(ctx, testTokenID1)
		require.Nil(t, token)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		token, err := emailTokenRepo.GetByID(getBadContext(t), testTokenID)
		require.Nil(t, token)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestEmailTokenUse(t *testing.T) {
	ctx := t.Context()
	beforeEachEmailTest(t)
	err := createEmailVerificationToken(ctx, 1, testTokenID)
	require.NoError(t, err)
	t.Run("successfully use token", func(t *testing.T) {
		err := emailTokenRepo.Use(ctx, testTokenID)
		require.NoError(t, err)
		token, err := emailTokenRepo.GetByID(ctx, testTokenID)
		require.NoError(t, err)
		require.NotNil(t, token.UsedAt)
	})
	t.Run("token not found", func(t *testing.T) {
		err := emailTokenRepo.Use(ctx, testTokenID1)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("token already used", func(t *testing.T) {
		err := emailTokenRepo.Use(ctx, testTokenID)
		require.ErrorIs(t, err, repo.ErrNotFound)
	})
	t.Run("database internal error", func(t *testing.T) {
		err := emailTokenRepo.Use(getBadContext(t), testTokenID)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}

func TestTokenDeleteUsedAndOldTokens(t *testing.T) {
	cleanDB(t)
	_, err := userRepo.Create(t.Context(), &basicUser)
	require.NoError(t, err)

	var testToken1 dto.EmailTokenCreate = dto.EmailTokenCreate{ID: testTokenID1, UserID: 1, ExpiredAt: time.Now().Add(time.Minute * 10), Purpose: dto.PurposeVerification}
	var testToken2 dto.EmailTokenCreate = dto.EmailTokenCreate{ID: testTokenID2, UserID: 1, ExpiredAt: time.Now().Add(time.Minute * 10), Purpose: dto.PurposeVerification}
	t.Run("successfully delete used and old tokens", func(t *testing.T) {
		err := emailTokenRepo.Create(t.Context(), &testToken1)
		require.NoError(t, err)
		err = emailTokenRepo.Create(t.Context(), &testToken2)
		require.NoError(t, err)
		// make token1 is older
		_, err = pg.Pool.Exec(
			t.Context(),
			`UPDATE email_tokens SET expired_at = $1 WHERE id = $2`,
			time.Now().Add(time.Hour*-7*24),
			testTokenID1,
		)
		require.NoError(t, err)
		// make token2 used
		_, err = pg.Pool.Exec(
			t.Context(),
			`UPDATE email_tokens SET used_at = $1 WHERE id = $2`,
			time.Now().Add(time.Hour*-7*24),
			testTokenID2,
		)
		require.NoError(t, err)
		num, err := emailTokenRepo.DeleteUsedAndOldTokens(t.Context(), 7)
		require.NoError(t, err)
		require.Equal(t, 2, num)
	})
	t.Run("database internal error", func(t *testing.T) {
		num, err := emailTokenRepo.DeleteUsedAndOldTokens(getBadContext(t), 1)
		require.Equal(t, 0, num)
		require.ErrorIs(t, err, repo.ErrInternal)
	})
}
