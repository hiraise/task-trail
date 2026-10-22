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

// Tokens is a new pair of session tokens for cookies.
type Tokens struct {
	UserID       entity.UserID
	AccessToken  service.IssuedToken
	RefreshToken service.IssuedToken
}

// Session is an open session: the user and their tokens.
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

// ResetLink is a password reset link and the moment it expires.
type ResetLink struct {
	URL       string
	ExpiresAt time.Time
}

type AcceptInvitation struct {
	Token    string
	Username string
	Password string
}

// InvitationInfo is what a person sees via an invitation link before accepting it.
type InvitationInfo struct {
	Email       entity.Email
	ProjectName string
	// InvitedBy is the inviter's name, or their email if there is no name.
	InvitedBy string
}
