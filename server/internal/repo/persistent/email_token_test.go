//go:build integration

package persistent

import (
	"context"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
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
	e := entity.EmailToken{
		ID:        tokenID,
		ExpiredAt: time.Now().Add(time.Minute * 10),
		UserID:    userID,
		Purpose:   entity.PurposeVerification,
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
		require.Equal(t, entity.PurposeVerification, token.Purpose)
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
