package response

import (
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
)

// ServiceSettings are the service settings (ServiceSettings in the contract).
type ServiceSettings struct {
	ServiceURL string `json:"serviceUrl"`
	// Mail is null if mail is not configured.
	Mail *MailSettings `json:"mail"`
}

// MailSettings are the SMTP settings. The API never returns the password, only whether it is saved (ADR-0015).
type MailSettings struct {
	Host        string  `json:"host"`
	Port        int     `json:"port"`
	Encryption  string  `json:"encryption"`
	Sender      string  `json:"sender"`
	Username    *string `json:"username"`
	PasswordSet bool    `json:"passwordSet"`
}

func NewServiceSettings(s dto.ServiceSettings) ServiceSettings {
	out := ServiceSettings{ServiceURL: s.ServiceURL}
	if m := s.Mail; m != nil {
		out.Mail = &MailSettings{
			Host:        m.Host,
			Port:        m.Port,
			Encryption:  string(m.Encryption),
			Sender:      m.Sender,
			Username:    m.Username,
			PasswordSet: m.Password != nil,
		}
	}
	return out
}

// AdminUser is a user in the admin section (AdminUser in the contract).
type AdminUser struct {
	User
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

func NewAdminUser(u *entity.UserAccount) AdminUser {
	// Time is in UTC (ADR-0018): the database returns it in the server's time zone
	return AdminUser{User: NewUser(u), IsAdmin: u.IsAdmin, CreatedAt: u.CreatedAt.UTC()}
}

func NewAdminUsers(users []*entity.UserAccount) []AdminUser {
	out := make([]AdminUser, len(users))
	for i, u := range users {
		out[i] = NewAdminUser(u)
	}
	return out
}

// PasswordResetLink is a password reset link the administrator hands over personally (PasswordResetLink in the contract).
type PasswordResetLink struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
}

func NewPasswordResetLink(l dto.ResetLink) PasswordResetLink {
	return PasswordResetLink{URL: l.URL, ExpiresAt: l.ExpiresAt.UTC()}
}
