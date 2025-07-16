package auth

import (
	"context"
	"errors"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
)

func (u *UseCase) Refresh(ctx context.Context, oldRT string) (*dto.RefreshRes, error) {
	userID, tokenID, err := u.verifyRT(ctx, oldRT)
	if err != nil {
		return nil, err
	}
	retVal := &dto.RefreshRes{}
	f := func(ctx context.Context) error {
		retVal.AT, retVal.RT, err = u.generateAuthTokens(userID)
		if err != nil {
			return err
		}
		if err := u.rtRepo.Create(ctx, &dto.RefreshTokenCreate{ID: retVal.RT.ID, ExpiredAt: retVal.RT.Exp, UserID: userID}); err != nil {
			if errors.Is(err, repo.ErrConflict) {
				return u.errHandler.Conflict(err, "refresh token already exists")
			}
			return u.errHandler.InternalTrouble(err, "failed to create new refresh token")
		}
		return u.revokeRT(ctx, tokenID, userID)
	}

	if err := u.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}

	return retVal, nil
}
