package auth

import (
	"context"
	"errors"
	"task-trail/internal/entity"
	"task-trail/internal/pkg/token"
	"task-trail/internal/repo"
)

func (u *UseCase) Refresh(ctx context.Context, oldRT string) (*token.Token, *token.Token, error) {
	userID, tokenID, err := u.verifyRT(ctx, oldRT)
	if err != nil {
		return nil, nil, err
	}
	var at, rt *token.Token
	f := func(ctx context.Context) error {
		at, rt, err = u.generateAuthTokens(userID)
		if err != nil {
			return err
		}
		if err := u.rtRepo.Create(ctx, &entity.RefreshToken{ID: rt.Jti, ExpiredAt: rt.Exp, UserID: userID}); err != nil {
			if errors.Is(err, repo.ErrConflict) {
				return u.errHandler.Conflict(err, "refresh token already exists")
			}
			return u.errHandler.InternalTrouble(err, "failed to create new refresh token")
		}
		return u.revokeRT(ctx, tokenID, userID)
	}

	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return nil, nil, err
	}

	return at, rt, nil
}
