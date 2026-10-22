package response

import (
	"time"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
)

// ServiceSettings — настройки сервиса (ServiceSettings в контракте).
type ServiceSettings struct {
	ServiceURL string `json:"serviceUrl"`
	// Mail — null, если почта не подключена.
	Mail *MailSettings `json:"mail"`
}

// MailSettings — настройки SMTP. Пароль API не отдаёт, только признак, что он сохранён (ADR-0015).
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

// AdminUser — пользователь в разделе администратора (AdminUser в контракте).
type AdminUser struct {
	User
	IsAdmin   bool      `json:"isAdmin"`
	CreatedAt time.Time `json:"createdAt"`
}

func NewAdminUser(u *entity.UserAccount) AdminUser {
	// Время — в UTC (ADR-0018): из базы оно приходит в поясе сервера
	return AdminUser{User: NewUser(u), IsAdmin: u.IsAdmin, CreatedAt: u.CreatedAt.UTC()}
}

func NewAdminUsers(users []*entity.UserAccount) []AdminUser {
	out := make([]AdminUser, len(users))
	for i, u := range users {
		out[i] = NewAdminUser(u)
	}
	return out
}

// PasswordResetLink — ссылка сброса пароля, которую администратор передаёт сам (PasswordResetLink в контракте).
type PasswordResetLink struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
}

func NewPasswordResetLink(l dto.ResetLink) PasswordResetLink {
	return PasswordResetLink{URL: l.URL, ExpiresAt: l.ExpiresAt.UTC()}
}
