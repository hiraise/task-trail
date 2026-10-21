package access

import (
	"context"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// LogoutService закрывает сессию refresh-токена. Недействительный токен — не ошибка:
// выход всё равно удаляет cookie, а закрывать нечего.
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
		// Только что обменянный, отозванный или истёкший токен закрывать не нужно
		return nil
	}
	err = s.txManager.DoWithTx(ctx, f)
	switch {
	case isReuse(err):
		// Кража: выход удался, но закрываем и все остальные сессии пользователя
		return s.refreshTokenRepository.RevokeAll(ctx, userID, now)
	case isNotFound(err):
		return nil
	}
	return err
}
