package auth

import (
	"context"
	"task-trail/internal/entity"
	"time"
)

func (u *UseCase) Verify(ctx context.Context, tokenID string) error {

	f := func(ctx context.Context) error {
		now := time.Now()
		token, err := u.getEmailToken(ctx, tokenID)

		if err != nil {
			return err
		}

		if err := u.updateUser(ctx, &entity.User{ID: token.UserID, VerifiedAt: &now}); err != nil {
			return err
		}
		
		return u.useEmailToken(ctx, tokenID)
	}

	return u.txManager.DoWithTx(ctx, f)

}
