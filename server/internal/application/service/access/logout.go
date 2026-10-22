package access

import (
	"context"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// LogoutService closes the session of a refresh token. An invalid token is not an error:
// logout deletes the cookies anyway, and there is nothing to close.
type LogoutService struct {
	txManager              transaction.TxManager
	clock                  service.Clock
	refreshTokenRepository repository.RefreshTokenRepository
	tokenService           service.AccessTokenService
}

func (s *LogoutService) Execute(ctx context.Context, rt string) error {
	u, r, err := s.tokenService.VerifyRefreshToken(rt)
	if err != nil {
		return nil
	}
	rtID := entity.RefreshTokenID(r)
	userID := entity.UserID(u)
	now := s.clock.Now()
	f := func(ctx context.Context) error {
		token, err := getUserToken(ctx, s.refreshTokenRepository, rtID, userID)
		if err != nil {
			return err
		}
		switch token.State(now) {
		case entity.RefreshTokenActive:
			token.Revoke(now)
			return s.refreshTokenRepository.Update(ctx, token)
		case entity.RefreshTokenReused:
			return domain.ErrRefreshTokenReused("tokenID", rtID, "userID", userID)
		}
		// A just exchanged, revoked or expired token needs no closing
		return nil
	}
	err = s.txManager.DoWithTx(ctx, f)
	switch {
	case isReuse(err):
		// Theft: logout succeeded, but all other sessions of the user are closed too
		return s.refreshTokenRepository.RevokeAll(ctx, userID, now)
	case isNotFound(err):
		return nil
	}
	return err
}
