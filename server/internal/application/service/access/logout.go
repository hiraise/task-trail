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
	oldToken, err := s.refreshTokenRepository.GetUserToken(ctx, rtID, userID)
	if err != nil {
		// возможно токен может быть удален из бд так как старый, но нужно ли это считать 401 или 500 хз.
		// по идее если токен разобрался но его в бд нет то можно просто 500 кинуть
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
