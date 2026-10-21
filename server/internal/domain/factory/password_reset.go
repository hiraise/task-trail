package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type PasswordResetFactory struct {
	tokens   service.LinkTokenGenerator
	clock    service.Clock
	lifetime time.Duration
}

func NewPasswordResetFactory(tokens service.LinkTokenGenerator, clock service.Clock, lifetime time.Duration) *PasswordResetFactory {
	return &PasswordResetFactory{tokens: tokens, clock: clock, lifetime: lifetime}
}

// New создаёт ссылку сброса: token уходит человеку, в сущности — только его хеш.
func (f *PasswordResetFactory) New(userID entity.UserID) (token string, reset *entity.PasswordReset) {
	token = f.tokens.Generate()
	now := f.clock.Now()
	return token, &entity.PasswordReset{
		TokenHash: entity.HashLinkToken(token),
		UserID:    userID,
		ExpiredAt: now.Add(f.lifetime),
		CreatedAt: now,
	}
}
