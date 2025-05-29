package entity

import "time"

type EmailTokenPurpose string

const (
	PurposeVerification EmailTokenPurpose = "verify"
	PurposeReset        EmailTokenPurpose = "reset"
)

type RefreshToken struct {
	ID        string
	UserID    int
	CreatedAt time.Time
	ExpiredAt time.Time
	RevokedAt *time.Time
}

type EmailToken struct {
	ID        string
	UserID    int
	Purpose   EmailTokenPurpose
	CreatedAt time.Time
	ExpiredAt time.Time
	UsedAt    *time.Time
}
