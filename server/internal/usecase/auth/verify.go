package auth

import (
	"context"
	"task-trail/internal/usecase/dto"
	"time"
)

func (u *UseCase) Verify(ctx context.Context, tokenID string) error {

	f := func(ctx context.Context) error {
		token, err := u.getEmailToken(ctx, tokenID)

		if err != nil {
			return err
		}

		if err := u.updateUser(ctx, &dto.UserUpdate{ID: token.UserID, VerifiedAt: time.Now()}); err != nil {
			return err
		}

		return u.useEmailToken(ctx, tokenID)
	}

	return u.txManager.DoWithTx(ctx, f)

}
