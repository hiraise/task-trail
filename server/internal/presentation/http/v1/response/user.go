package response

import "task-trail/internal/domain/entity"

// User — пользователь, каким его видят другие (User в контракте).
type User struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	// AvatarID — ID файла для GET /v1/files/{fileId} или null.
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

// CurrentUser — пользователь, который вошёл (CurrentUser в контракте).
type CurrentUser struct {
	User
	IsAdmin bool `json:"isAdmin"`
}

func NewCurrentUser(u *entity.UserAccount) CurrentUser {
	return CurrentUser{User: NewUser(u), IsAdmin: u.IsAdmin}
}

// PublicSettings — настройки, нужные вебу до входа.
type PublicSettings struct {
	RegistrationOpen bool `json:"registrationOpen"`
	MailEnabled      bool `json:"mailEnabled"`
}

// InvitationInfo — куда ведёт ссылка приглашения (InvitationInfo в контракте).
type InvitationInfo struct {
	Email       string `json:"email"`
	ProjectName string `json:"projectName"`
	InvitedBy   string `json:"invitedBy"`
}
