package entity

import (
	"task-trail/internal/domain"
	"time"
)

type RefreshTokenID string

type RefreshToken struct {
	ID        RefreshTokenID
	UserID    UserID
	ExpiredAt time.Time
	RevokedAt *time.Time
}

func NewRefreshToken(id RefreshTokenID, userID UserID, expiredAt time.Time, revokedAt *time.Time) *RefreshToken {
	return &RefreshToken{ID: id, UserID: userID, ExpiredAt: expiredAt, RevokedAt: revokedAt}
}

func (t *RefreshToken) Validate() error {
	if t.ExpiredAt.Unix() <= time.Now().Unix() {
		return domain.ErrRefreshTokenExpired("tokenID", t.ID, "userID", t.UserID)
	}
	if t.RevokedAt != nil {
		return domain.ErrRefreshTokenAlreadyUsed("tokenID", t.ID, "userID", t.UserID)
	}
	return nil
}

func (t *RefreshToken) Use() {
	now := time.Now()
	t.RevokedAt = &now
}
