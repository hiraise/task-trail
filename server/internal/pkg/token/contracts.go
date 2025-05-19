package token

import "time"

type Token struct {
	Token string
	Exp   time.Time
	Jti   string
}

type Service interface {
	// Generate access token by user id
	GenAccessToken(userId int) (*Token, error)
	// Generate refresh token and jti by user id
	GenRefreshToken(userId int) (*Token, error)
	VerifyAccessToken(token string) (userId int, err error)
	VerifyRefreshToken(token string) (userId int, jti string, err error)
}
