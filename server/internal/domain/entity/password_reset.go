package entity

import "time"

// PasswordReset — a password reset link. Works once: a reset deletes all the user's links
// and closes their sessions.
type PasswordReset struct {
	TokenHash LinkTokenHash
	UserID    UserID
	ExpiredAt time.Time
	CreatedAt time.Time
}

func (r *PasswordReset) IsExpired(now time.Time) bool {
	return !now.Before(r.ExpiredAt)
}

// Lifetime — how long the link is valid from creation: the letter states the term.
func (r *PasswordReset) Lifetime() time.Duration {
	return r.ExpiredAt.Sub(r.CreatedAt)
}
