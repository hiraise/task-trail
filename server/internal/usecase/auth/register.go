package auth

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Register(ctx context.Context, data *dto.Credentials) error {

	f := func(ctx context.Context) error {
		hash, err := u.passwordSvc.HashPassword(data.Password)
		if err != nil {
			return u.errHandler.InternalTrouble(err, "failed to hash password")
		}
		// create user
		user := &dto.UserCreate{Email: data.Email, PasswordHash: string(hash)}
		id, err := u.userRepo.Create(ctx, user)
		if err != nil {
			if errors.Is(err, repo.ErrConflict) {
				return u.errHandler.Conflict(err, "email already taken", "email", data.Email)
			}
			return u.errHandler.InternalTrouble(err, "failed to create new user", "email", data.Email)
		}
		// create email token
		tokenID, err := u.createEmailToken(ctx, id, dto.PurposeVerification)
		if err != nil {
			return err
		}
		// send verification
		if err := u.notificationRepo.SendVerificationEmail(ctx, data.Email, tokenID); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to send verification email", "userID", id)
		}
		return nil
	}

	return u.txManager.DoWithTx(ctx, f)
}
