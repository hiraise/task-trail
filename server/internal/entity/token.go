package entity

import "time"

type Token struct {
	ID        string
	UserId    int
	CreatedAt time.Time
	ExpiredAt time.Time
	RevokedAt *time.Time
}
