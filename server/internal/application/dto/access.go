package dto

import "time"

type Credentials struct {
	Email    string
	Password string
}

type ResetPassword struct {
	Token    string
	Password string
}

type ChangePassword struct {
	OldPassword string
	NewPassword string
}
type AccessToken struct {
	Token     string
	ExpiredAt time.Time
}

type RefreshToken struct {
	Token     string
	ExpiredAt time.Time
}

type SuccessLogin struct {
	UserID       string
	AccessToken  AccessToken
	RefreshToken RefreshToken
}
