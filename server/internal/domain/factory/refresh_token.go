package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type RefreshTokenFactory struct {
	idGenerator   service.IDGenerator
	clock         service.Clock
	tokenLifetime time.Duration
}

func NewRTFactory(idGenerator service.IDGenerator, clock service.Clock, tokenLifeTime time.Duration) *RefreshTokenFactory {
	return &RefreshTokenFactory{idGenerator: idGenerator, clock: clock, tokenLifetime: tokenLifeTime}
}

func (f *RefreshTokenFactory) NewToken(userID entity.UserID) *entity.RefreshToken {
	return &entity.RefreshToken{
		ID:        entity.RefreshTokenID(f.idGenerator.Generate()),
		UserID:    userID,
		ExpiredAt: f.clock.Now().Add(f.tokenLifetime),
	}
}

func (f *RefreshTokenFactory) Restore(id string, userID string, expiredAt time.Time, rotatedAt *time.Time, revokedAt *time.Time) *entity.RefreshToken {
	return &entity.RefreshToken{
		ID:        entity.RefreshTokenID(id),
		UserID:    entity.UserID(userID),
		ExpiredAt: expiredAt,
		RotatedAt: rotatedAt,
		RevokedAt: revokedAt,
	}
}
