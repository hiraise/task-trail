package service

import (
	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
)

type AccessTokenService interface {
	GenerateTokensPair(userID entity.UserID, jti *entity.RefreshToken) (dto.AccessToken, dto.RefreshToken, error)
	GenerateAccessToken(userID entity.UserID) (dto.AccessToken, error)
	GenerateRefreshToken(userID entity.UserID, jti *entity.RefreshToken) (dto.RefreshToken, error)
	VerifyAccessToken(token string) (userID string, err error)
	VerifyRefreshToken(token string) (userID string, jti string, err error)
}
