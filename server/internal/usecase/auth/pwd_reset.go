package auth

import (
	"context"
	"task-trail/internal/entity"
)

func (u *UseCase) ResetPassword(ctx context.Context, tokenID string, password string) error {
	f := func(ctx context.Context) error {
		token, err := u.getEmailToken(ctx, tokenID)
		if err != nil {
			return err
		}

		hash, err := u.passwordSvc.HashPassword(password)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "password hashing failed")
		}

		if err := u.updateUser(ctx, &entity.User{ID: token.UserID, PasswordHash: hash}); err != nil {
			return err
		}

		return u.useEmailToken(ctx, tokenID)
	}
	return u.txManager.DoWithTx(ctx, f)
}
