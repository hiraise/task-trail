package dto

import "time"

// entity
type EmailTokenPurpose string

const (
	PurposeVerification EmailTokenPurpose = "verify"
	PurposeReset        EmailTokenPurpose = "reset"
)

type EmailToken struct {
	ID        string
	UserID    int
	Purpose   EmailTokenPurpose
	CreatedAt time.Time
	ExpiredAt time.Time
	UsedAt    *time.Time
}

type RefreshToken struct {
	ID        string
	UserID    int
	CreatedAt time.Time
	ExpiredAt time.Time
	RevokedAt *time.Time
}

// request

type RefreshTokenCreate struct {
	ID        string
	UserID    int
	ExpiredAt time.Time
}

type EmailTokenCreate struct {
	ID        string
	UserID    int
	ExpiredAt time.Time
	Purpose   EmailTokenPurpose
}

// response

type AccessTokenRes struct {
	Token string
	Exp   time.Time
}
type RefreshTokenRes struct {
	Token string
	Exp   time.Time
	ID    string
}
