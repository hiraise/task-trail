package response

import "task-trail/internal/domain/entity"

// User is a user as others see them (User in the contract).
type User struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	// AvatarID is the file ID for GET /v1/files/{fileId}, or null.
	AvatarID *string `json:"avatarId"`
}

func NewUser(u *entity.UserAccount) User {
	var avatarID *string
	if u.AvatarID != nil {
		id := string(*u.AvatarID)
		avatarID = &id
	}
	return User{ID: string(u.ID), Email: string(u.Email), Username: u.Username, AvatarID: avatarID}
}

func NewUsers(users []*entity.UserAccount) []User {
	out := make([]User, len(users))
	for i, u := range users {
		out[i] = NewUser(u)
	}
	return out
}

// CurrentUser is the signed-in user (CurrentUser in the contract).
type CurrentUser struct {
	User
	IsAdmin bool `json:"isAdmin"`
	// EmailNotifications — notification emails are on (ADR-0038).
	EmailNotifications bool `json:"emailNotifications"`
}

func NewCurrentUser(u *entity.UserAccount) CurrentUser {
	return CurrentUser{User: NewUser(u), IsAdmin: u.IsAdmin, EmailNotifications: u.EmailNotifications}
}

// PublicSettings are the settings the web needs before sign-in.
type PublicSettings struct {
	RegistrationOpen bool `json:"registrationOpen"`
	MailEnabled      bool `json:"mailEnabled"`
}

// InvitationInfo is where an invitation link leads (InvitationInfo in the contract).
type InvitationInfo struct {
	Email       string `json:"email"`
	ProjectName string `json:"projectName"`
	InvitedBy   string `json:"invitedBy"`
}
