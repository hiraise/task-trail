package token

import "task-trail/internal/usecase/dto"

type Service interface {
	// Generate access token by user id
	GenAccessToken(userID int) (*dto.AccessTokenRes, error)
	// Generate refresh token and jti by user id
	GenRefreshToken(userID int) (*dto.RefreshTokenRes, error)
	VerifyAccessToken(token string) (userID int, err error)
	VerifyRefreshToken(token string) (userID int, jti string, err error)
}
