package token

import "time"

type Token struct {
	Token string
	Exp   time.Time
	Jti   string
}

type Service interface {
	// Generate access token by user id
	GenAccessToken(userID int) (*Token, error)
	// Generate refresh token and jti by user id
	GenRefreshToken(userID int) (*Token, error)
	VerifyAccessToken(token string) (userID int, err error)
	VerifyRefreshToken(token string) (userID int, jti string, err error)
}
