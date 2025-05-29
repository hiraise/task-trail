package auth

import (
	"context"
	"errors"
	"task-trail/internal/entity"
	"task-trail/internal/repo"
)

func (u *UseCase) Register(ctx context.Context, email string, password string) error {

	f := func(ctx context.Context) error {
		hash, err := u.passwordSvc.HashPassword(password)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "password hashing failed")
		}
		// create user
		user := &entity.User{Email: email, PasswordHash: string(hash)}
		id, err := u.userRepo.Create(ctx, user)
		if err != nil {
			if errors.Is(err, repo.ErrConflict) {
				return u.errHandler.Conflict(err, "email already taken", "email", email)
			}
			return u.errHandler.InternalTrouble(err, "failed to create new user", "email", email)
		}
		// create email token
		tokenID, err := u.createEmailToken(ctx, id, entity.PurposeVerification)
		if err != nil {
			return err
		}
		// send verification
		if err := u.notificationRepo.SendVerificationEmail(ctx, email, tokenID); err != nil {
			return u.errHandler.InternalTrouble(err, "verification email sending failed", "userID", id)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}
