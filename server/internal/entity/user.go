package entity

import "time"

type User struct {
	ID           int        `json:"id"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	VerifiedAt   *time.Time `json:"verifiedAt"`
}
