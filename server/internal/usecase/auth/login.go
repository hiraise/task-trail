package auth

import (
	"context"
	"errors"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
)

func (u *UseCase) Login(ctx context.Context, email string, password string) (int, *token.Token, *token.Token, error) {
	user, err := u.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return 0, nil, nil, u.errHandler.InvalidCredentials(err, "user not found", "email", email)
		}
		return 0, nil, nil, u.errHandler.InternalTrouble(err, "user loading failed", "email", email)

	}
	if user.VerifiedAt == nil {
		return 0, nil, nil, u.errHandler.InvalidCredentials(nil, "user is unverified", "email", email)
	}
	if err := u.passwordSvc.ComparePassword(password, user.PasswordHash); err != nil {
		return 0, nil, nil, u.errHandler.InvalidCredentials(err, "user password is invalid", "email", email)
	}

	at, rt, err := u.generateAuthTokens(user.ID)
	if err != nil {
		return 0, nil, nil, err
	}

	t := &entity.RefreshToken{
		ID:        rt.Jti,
		ExpiredAt: rt.Exp,
		UserID:    user.ID,
	}
	if err := u.rtRepo.Create(ctx, t); err != nil {
		if errors.Is(err, repo.ErrConflict) {
			return 0, nil, nil, u.errHandler.Conflict(err, "refresh token already exists", "tokenID", t.ID, "userID", user.ID)
		}
		if errors.Is(err, repo.ErrNotFound) {
			return 0, nil, nil, u.errHandler.InternalTrouble(err, "user not found", "tokenID", t.ID, "userID", user.ID)
		}
		return 0, nil, nil, u.errHandler.InternalTrouble(err, "failed to create new refresh token", "tokenID", t.ID, "userID", user.ID)
	}
	return user.ID, at, rt, nil
}
