package auth

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Login(ctx context.Context, data *dto.Credentials) (*dto.LoginRes, error) {
	user, err := u.userRepo.GetByEmail(ctx, data.Email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.InvalidCredentials(err, "user not found", "email", data.Email)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to get user", "email", data.Email)

	}
	if user.VerifiedAt == nil {
		return nil, u.errHandler.InvalidCredentials(nil, "user is unverified", "email", data.Email)
	}
	if err := u.passwordSvc.ComparePassword(data.Password, user.PasswordHash); err != nil {
		return nil, u.errHandler.InvalidCredentials(err, "user password is invalid", "email", data.Email)
	}
	retVal := &dto.LoginRes{
		UserID: user.ID,
	}
	retVal.AT, retVal.RT, err = u.generateAuthTokens(user.ID)
	if err != nil {
		return nil, err
	}

	t := &dto.RefreshTokenCreate{
		ID:        retVal.RT.ID,
		ExpiredAt: retVal.RT.Exp,
		UserID:    user.ID,
	}
	if err := u.rtRepo.Create(ctx, t); err != nil {
		if errors.Is(err, repo.ErrConflict) {
			return nil, u.errHandler.Conflict(err, "refresh token already exists", "tokenID", t.ID, "userID", user.ID)
		}
		if errors.Is(err, repo.ErrNotFound) {
			return nil, u.errHandler.InternalTrouble(err, "user not found", "tokenID", t.ID, "userID", user.ID)
		}
		return nil, u.errHandler.InternalTrouble(err, "failed to create new refresh token", "tokenID", t.ID, "userID", user.ID)
	}
	return retVal, nil
}
