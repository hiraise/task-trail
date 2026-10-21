package dto

import "task-trail/internal/domain/service"

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
type SuccessLogin struct {
	UserID       string
	AccessToken  service.IssuedToken
	RefreshToken service.IssuedToken
}
