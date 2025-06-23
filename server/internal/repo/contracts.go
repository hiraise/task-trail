package repo

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/entity"
)

var ErrNotFound = errors.New("entity not found")
var ErrConflict = errors.New("entity already exists")
var ErrInternal = errors.New("something went wrong")

func Wrap(err error, background error) error {
	return fmt.Errorf("%w, error: %w", err, background)
}

type TxManager interface {
	DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) (int, error)
	EmailIsTaken(ctx context.Context, email string) (bool, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	GetByID(ctx context.Context, ID int) (*entity.User, error)
	Update(ctx context.Context, user *entity.User) error
}
type VerificationRepository interface {
	Create(ctx context.Context, userID int, code int) error
	Verify(ctx context.Context, code int) error
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *entity.RefreshToken) error
	GetByID(ctx context.Context, tokenID string, userID int) (*entity.RefreshToken, error)
	Revoke(ctx context.Context, tokenID string) error
	RevokeAllUsersTokens(ctx context.Context, userID int) (int, error)
	DeleteRevokedAndOldTokens(ctx context.Context, olderThan int) (int, error)
}

type EmailTokenRepository interface {
	GetByID(ctx context.Context, tokenID string) (*entity.EmailToken, error)
	Create(ctx context.Context, token entity.EmailToken) error
	Use(ctx context.Context, tokenID string) error
	DeleteUsedAndOldTokens(ctx context.Context, olderThan int) (int, error)
}

type NotificationRepository interface {
	SendVerificationEmail(ctx context.Context, email string, token string) error
	SendResetPasswordEmail(ctx context.Context, email string, token string) error
}
