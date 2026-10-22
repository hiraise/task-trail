package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
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

type ResetPassword struct {
	Token    string
	Password string
}

// ResetLink — ссылка сброса пароля и момент, когда она истекает.
type ResetLink struct {
	URL       string
	ExpiresAt time.Time
}

type AcceptInvitation struct {
	Token    string
	Username string
	Password string
}

// InvitationInfo — что человек видит по ссылке приглашения до принятия.
type InvitationInfo struct {
	Email       entity.Email
	ProjectName string
	// InvitedBy — имя пригласившего, а если его нет — почта.
	InvitedBy string
}
