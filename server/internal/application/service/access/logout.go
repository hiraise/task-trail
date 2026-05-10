package access

import (
	"context"
	"errors"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type LogoutService struct {
	txManager              transaction.TxManager
	refreshTokenRepository repository.RefreshTokenRepository
	tokenService           service.AccessTokenService
}

func (s *LogoutService) Execute(ctx context.Context, rt string) error {
	u, r, err := s.tokenService.VerifyRefreshToken(rt)
	if err != nil {
		return err
	}
	rtID := entity.RefreshTokenID(r)
	userID := entity.UserID(u)
	f := func(ctx context.Context) error {
		oldToken, err := s.refreshTokenRepository.GetUserToken(ctx, rtID, userID)
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.EntityNotFound {
					return domain.ErrRefreshTokenNotFound()
				}
			}
			return err
		}
		if err := oldToken.Validate(); err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.RefreshTokenAlreadyUsed {
					// Revoke all
				}
			}
			return err
		}

		oldToken.Use()
		if err := s.refreshTokenRepository.Update(ctx, oldToken); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)

}
