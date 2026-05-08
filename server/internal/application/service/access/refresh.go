package access

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type RefreshService struct {
	txManager              transaction.TxManager
	userRepository         repository.UserRepository
	refreshTokenRepository repository.RefreshTokenRepository
	refreshTokenFactory    *factory.RefreshTokenFactory
	pwdComparator          password.PasswordComparator
	tokenService           service.AccessTokenService
}

func (s *RefreshService) Execute(ctx context.Context, rt string) (dto.SuccessLogin, error) {
	u, r, err := s.tokenService.VerifyRefreshToken(rt)
	if err != nil {
		return dto.SuccessLogin{}, err
	}
	rtID := entity.RefreshTokenID(r)
	userID := entity.UserID(u)
	var retVal *dto.SuccessLogin
	f := func(ctx context.Context) error {
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

		newToken := s.refreshTokenFactory.NewToken(userID)
		err = s.refreshTokenRepository.Create(ctx, newToken)
		if err != nil {
			return err
		}

		at, rt, err := s.tokenService.GenerateTokensPair(userID, newToken)
		if err != nil {
			return err
		}
		if err := s.refreshTokenRepository.Update(ctx, oldToken); err != nil {
			return err
		}
		retVal = &dto.SuccessLogin{
			AccessToken:  at,
			RefreshToken: rt,
			UserID:       string(userID),
		}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.SuccessLogin{}, err
	}
	return *retVal, nil

}
