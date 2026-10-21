package response

import "task-trail/internal/domain/entity"

// CurrentUser — пользователь, который вошёл (CurrentUser в контракте).
type CurrentUser struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
	AvatarID *string `json:"avatarId"`
	IsAdmin  bool    `json:"isAdmin"`
}

func NewCurrentUser(u *entity.UserAccount) CurrentUser {
	return CurrentUser{
		ID:       string(u.ID),
		Email:    string(u.Email),
		Username: u.Username,
		AvatarID: u.AvatarID,
		IsAdmin:  u.IsAdmin,
	}
}

// PublicSettings — настройки, нужные вебу до входа.
type PublicSettings struct {
	RegistrationOpen bool `json:"registrationOpen"`
	MailEnabled      bool `json:"mailEnabled"`
}
