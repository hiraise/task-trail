package auth

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) ResetPassword(ctx context.Context, data *dto.PasswordReset) error {
	f := func(ctx context.Context) error {
		token, err := u.getEmailToken(ctx, data.TokenID)
		if err != nil {
			return err
		}

		h, err := u.passwordSvc.HashPassword(data.NewPassword)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to hash password")
		}

		if err := u.updateUser(ctx, &dto.UserUpdate{ID: token.UserID, PasswordHash: h}); err != nil {
			return err
		}

		return u.useEmailToken(ctx, data.TokenID)
	}
	return u.txManager.DoWithTx(ctx, f)
}
