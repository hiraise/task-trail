package service

import (
	"time"

	"task-trail/internal/domain/entity"
)

// IssuedToken — a signed token and the moment it expires.
type IssuedToken struct {
	Token     string
	ExpiredAt time.Time
}

type AccessTokenService interface {
	GenerateTokensPair(userID entity.UserID, jti *entity.RefreshToken) (IssuedToken, IssuedToken, error)
	GenerateAccessToken(userID entity.UserID) (IssuedToken, error)
	GenerateRefreshToken(userID entity.UserID, jti *entity.RefreshToken) (IssuedToken, error)
	VerifyAccessToken(token string) (userID string, err error)
	VerifyRefreshToken(token string) (userID string, jti string, err error)
}
