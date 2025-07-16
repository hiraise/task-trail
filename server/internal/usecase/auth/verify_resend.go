package auth

import (
	"context"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) ResendVerificationEmail(ctx context.Context, email string) error {

	f := func(ctx context.Context) error {
		user, err := u.getUserByEmail(ctx, email)
		if err != nil {
			return err
		}
		if user.VerifiedAt != nil {
			return u.errHandler.BadRequest(nil, "user already verified", "userID", user.ID)
		}
		// create email token
		tokenID, err := u.createEmailToken(ctx, user.ID, dto.PurposeVerification)
		if err != nil {
			return err
		}
		// send verification
		if err := u.notificationRepo.SendVerificationEmail(ctx, email, tokenID); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to send verification email", "userID", user.ID)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}
