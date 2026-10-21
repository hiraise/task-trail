package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
)

type Register struct {
	Email      string
	Password   string
	Username   string
	ServiceURL string
}

type Credentials struct {
	Email    string
	Password string
}

type ChangePassword struct {
	OldPassword string
	NewPassword string
}

// Tokens — новая пара токенов сессии для cookie.
type Tokens struct {
	UserID       entity.UserID
	AccessToken  service.IssuedToken
	RefreshToken service.IssuedToken
}

// Session — открытая сессия: пользователь и его токены.
type Session struct {
	User *entity.UserAccount
	Tokens
}

type PublicSettings struct {
	RegistrationOpen bool
	MailEnabled      bool
}
