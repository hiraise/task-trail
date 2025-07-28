package auth

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"task-trail/internal/utils"
)

func (u *UseCase) AutoRegister(ctx context.Context, email string) (int, error) {

	var id int
	var err error
	f := func(ctx context.Context) error {
		// create user
		user := &dto.UserCreate{Email: email, PasswordHash: " ", VerifiedAt: utils.GetCurrentTime()}
		id, err = u.userRepo.Create(ctx, user)
		if err != nil {
			if errors.Is(err, repo.ErrConflict) {
				return u.errHandler.Conflict(err, "email already taken", "email", email)
			}
			return u.errHandler.InternalTrouble(err, "failed to create new user", "email", email)
		}

		if err := u.notificationRepo.SendAutoRegisterEmail(ctx, email); err != nil {
			return u.errHandler.InternalTrouble(err, "failed to send registration email", "email", email)
		}
		return nil
	}
	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return 0, err
	}
	return id, nil
}
