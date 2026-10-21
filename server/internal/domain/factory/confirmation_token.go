package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type ConfirmationTokenFactory struct {
	idGenerator   service.IDGenerator
	tokenLifetime time.Duration
}

func NewCTFactory(idGenerator service.IDGenerator, tokenLifeTime time.Duration) *ConfirmationTokenFactory {
	return &ConfirmationTokenFactory{idGenerator: idGenerator, tokenLifetime: tokenLifeTime}
}

func (f *ConfirmationTokenFactory) NewToken(userID entity.UserID, purpose entity.ConfirmationTokenPurpose) *entity.ConfirmationToken {
	return &entity.ConfirmationToken{
		ID:        entity.ConfirmationTokenID(f.idGenerator.Generate()),
		UserID:    userID,
		ExpiredAt: time.Now().Add(f.tokenLifetime),
		Purpose:   purpose,
		UsedAt:    nil,
	}
}

func (f *ConfirmationTokenFactory) Restore(id string, userID string, purpose string, expiredAt time.Time, usedAt *time.Time) *entity.ConfirmationToken {
	return &entity.ConfirmationToken{
		ID:        entity.ConfirmationTokenID(id),
		UserID:    entity.UserID(userID),
		ExpiredAt: expiredAt,
		Purpose:   entity.ConfirmationTokenPurpose(purpose),
		UsedAt:    usedAt,
	}
}
