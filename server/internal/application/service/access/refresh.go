package access

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"time"
)

// RefreshService обменивает refresh-токен на новую пару. Каждый токен обменивается один раз;
// повтор в течение entity.RefreshTokenReuseGrace — параллельный запрос другой вкладки,
// позже — кража: отзываются все токены пользователя.
type RefreshService struct {
	txManager              transaction.TxManager
	clock                  service.Clock
	refreshTokenRepository repository.RefreshTokenRepository
	tokenService           service.AccessTokenService
	sessions               *sessionOpener
}

func (s *RefreshService) Execute(ctx context.Context, rt string) (dto.Tokens, error) {
	u, r, err := s.tokenService.VerifyRefreshToken(rt)
	if err != nil {
		return dto.Tokens{}, err
	}
	rtID := entity.RefreshTokenID(r)
	userID := entity.UserID(u)
	now := s.clock.Now()
	var tokens dto.Tokens
	f := func(ctx context.Context) error {
		token, err := getUserToken(ctx, s.refreshTokenRepository, rtID, userID)
		if err != nil {
			return err
		}
		switch token.State(now) {
		case entity.RefreshTokenActive:
			token.Rotate(now)
			if err := s.refreshTokenRepository.Update(ctx, token); err != nil {
				return err
			}
		case entity.RefreshTokenJustRotated:
			// Параллельный запрос: обменянный токен уже отмечен, выдаём ещё одну пару
		case entity.RefreshTokenReused:
			return domain.ErrRefreshTokenReused("tokenID", rtID, "userID", userID)
		case entity.RefreshTokenRevoked:
			return domain.ErrRefreshTokenRevoked("tokenID", rtID, "userID", userID)
		default:
			return domain.ErrRefreshTokenExpired("tokenID", rtID, "userID", userID)
		}
		tokens, err = s.sessions.open(ctx, userID)
		return err
	}
	err = s.txManager.DoWithTx(ctx, f)
	if isReuse(err) {
		return dto.Tokens{}, revokeAll(ctx, s.refreshTokenRepository, userID, now, err)
	}
	if err != nil {
		return dto.Tokens{}, err
	}
	return tokens, nil
}

func getUserToken(ctx context.Context, repo repository.RefreshTokenRepository, id entity.RefreshTokenID, userID entity.UserID) (*entity.RefreshToken, error) {
	token, err := repo.GetForUpdate(ctx, id, userID)
	if err != nil {
		var e *domain.DomainError
		if errors.As(err, &e) && e.Code == domain.EntityNotFound {
			return nil, domain.ErrRefreshTokenNotFound("tokenID", id, "userID", userID)
		}
		return nil, err
	}
	return token, nil
}

func isReuse(err error) bool {
	var e *domain.DomainError
	return errors.As(err, &e) && e.Code == domain.RefreshTokenReused
}

func isNotFound(err error) bool {
	var e *domain.DomainError
	return errors.As(err, &e) && e.Code == domain.RefreshTokenNotFound
}

// revokeAll отзывает все токены пользователя после кражи. Вызывается после транзакции,
// которая нашла кражу: внутри неё отзыв откатился бы вместе с ошибкой.
func revokeAll(ctx context.Context, repo repository.RefreshTokenRepository, userID entity.UserID, now time.Time, reuseErr error) error {
	if err := repo.RevokeAll(ctx, userID, now); err != nil {
		return domain.Wrap(err, reuseErr)
	}
	return reuseErr
}
