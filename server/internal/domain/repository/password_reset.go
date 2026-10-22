package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

type PasswordResetRepository interface {
	Create(ctx context.Context, reset *entity.PasswordReset) error
	// GetForUpdate reads a link by the token hash and locks its row until the end of the transaction:
	// two simultaneous resets by one link will not both succeed.
	GetForUpdate(ctx context.Context, hash entity.LinkTokenHash) (*entity.PasswordReset, error)
	// DeleteByUser deletes all password reset links of the user.
	DeleteByUser(ctx context.Context, userID entity.UserID) error
	// DeleteExpired deletes links expired by now and returns how many were deleted.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
