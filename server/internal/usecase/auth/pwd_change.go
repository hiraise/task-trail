package auth

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) ChangePassword(ctx context.Context, data *dto.PasswordChange) error {
	if data.NewPassword == data.OldPassword {
		return u.errHandler.BadRequest(nil, "passwords are equal", "userID", data.UserID)
	}
	user, err := u.userRepo.GetByID(ctx, data.UserID)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return u.errHandler.BadRequest(err, "user not found", "userID", data.UserID)
		}
		return u.errHandler.InternalTrouble(err, "failed to password change", "userID", data.UserID)
	}
	if err := u.passwordSvc.ComparePassword(data.OldPassword, user.PasswordHash); err != nil {
		return u.errHandler.BadRequest(err, "incorrect old password", "userID", data.UserID)
	}
	h, err := u.passwordSvc.HashPassword(data.NewPassword)
	if err != nil {
		return u.errHandler.InternalTrouble(err, "failed to hash password", "userID", data.UserID)
	}
	if err := u.updateUser(ctx, &dto.UserUpdate{PasswordHash: h, ID: user.ID}); err != nil {
		return err
	}
	return nil
}
