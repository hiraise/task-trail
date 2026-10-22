package entity

import "time"

// PasswordReset — ссылка сброса пароля. Срабатывает один раз: сброс удаляет все ссылки
// пользователя и закрывает его сессии.
type PasswordReset struct {
	TokenHash LinkTokenHash
	UserID    UserID
	ExpiredAt time.Time
	CreatedAt time.Time
}

func (r *PasswordReset) IsExpired(now time.Time) bool {
	return !now.Before(r.ExpiredAt)
}

// Lifetime — сколько ссылка действует с момента создания: срок называет письмо.
func (r *PasswordReset) Lifetime() time.Duration {
	return r.ExpiredAt.Sub(r.CreatedAt)
}
