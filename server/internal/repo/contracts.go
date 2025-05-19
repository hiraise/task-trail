package repo

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var ErrInternal = errors.New("internal error")
var ErrNotFound = errors.New("entity not found")
var ErrConflict = errors.New("entity already exists")
var ErrDB = errors.New("something went wrong in db")

func Wrap(err error, background error) error {
	return fmt.Errorf("%w, error: %w", err, background)
}

type TxManager interface {
	DoWithTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type UserRepository interface {
	Create(ctx context.Context, user *entity.User) error
	EmailIsTaken(ctx context.Context, email string) (bool, error)
	GetUserByEmail(ctx context.Context, email string) (*entity.User, error)
}
type VerificationRepository interface {
	Create(ctx context.Context, userId int, code int) error
	Verify(ctx context.Context, code int) error
}

type TokenRepository interface {
	Create(ctx context.Context, token *entity.Token) error
	GetTokenById(ctx context.Context, tokenId string, userId int) (*entity.Token, error)
	RevokeToken(ctx context.Context, tokenId string) error
	RevokeAllUsersTokens(ctx context.Context, userId int) (int, error)
}

type pgConn interface {
	Exec(ctx context.Context, sql string, arguments ...any) (commandTag pgconn.CommandTag, err error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}
