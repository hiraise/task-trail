package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type RefreshTokenFactory struct {
	idGenerator   service.IDGenerator
	tokenLifetime time.Duration
}

func NewRTFactory(idGenerator service.IDGenerator, tokenLifeTime time.Duration) *RefreshTokenFactory {
	return &RefreshTokenFactory{idGenerator: idGenerator, tokenLifetime: tokenLifeTime}
}
func (f *RefreshTokenFactory) NewToken(userID entity.UserID) *entity.RefreshToken {
	return entity.NewRefreshToken(
		entity.RefreshTokenID(f.idGenerator.Generate()),
		userID,
		time.Now().Add(f.tokenLifetime),
		nil,
	)
}
func (f *RefreshTokenFactory) Restore(id string, userID string, expiredAt time.Time, revoked_at *time.Time) *entity.RefreshToken {
	return &entity.RefreshToken{
		ID:        entity.RefreshTokenID(id),
		UserID:    entity.UserID(userID),
		ExpiredAt: expiredAt,
		RevokedAt: revoked_at,
	}
}
