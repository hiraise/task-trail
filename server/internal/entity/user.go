package entity

import "time"

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Verified_at  time.Time `json:"verified_at"`
}
