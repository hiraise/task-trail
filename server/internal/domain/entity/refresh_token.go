package entity

import (
	"time"
)

type RefreshTokenID string

// RefreshTokenReuseGrace — сколько обменянный refresh-токен ещё годится: столько длится
// параллельный запрос из другой вкладки с той же cookie. Позже его использование — кража
// (контракт, POST /v1/auth/refresh).
const RefreshTokenReuseGrace = 30 * time.Second

type RefreshToken struct {
	ID        RefreshTokenID
	UserID    UserID
	ExpiredAt time.Time
	// RotatedAt — когда токен обменяли на новую пару.
	RotatedAt *time.Time
	// RevokedAt — когда сессию закрыли: выход или отзыв всех токенов пользователя.
	RevokedAt *time.Time
}

type RefreshTokenState int

const (
	// RefreshTokenActive — токен действует.
	RefreshTokenActive RefreshTokenState = iota
	// RefreshTokenJustRotated — токен обменяли не больше RefreshTokenReuseGrace назад:
	// параллельный запрос тоже получает новую пару.
	RefreshTokenJustRotated
	// RefreshTokenReused — обменянный токен пришёл после окна: его копия у кого-то ещё,
	// отзывай все токены пользователя.
	RefreshTokenReused
	RefreshTokenRevoked
	RefreshTokenExpired
)

func (t *RefreshToken) State(now time.Time) RefreshTokenState {
	switch {
	case !now.Before(t.ExpiredAt):
		return RefreshTokenExpired
	case t.RevokedAt != nil:
		return RefreshTokenRevoked
	case t.RotatedAt == nil:
		return RefreshTokenActive
	case now.Sub(*t.RotatedAt) <= RefreshTokenReuseGrace:
		return RefreshTokenJustRotated
	default:
		return RefreshTokenReused
	}
}

// Rotate отмечает, что токен обменяли на новую пару.
func (t *RefreshToken) Rotate(now time.Time) {
	t.RotatedAt = &now
}

// Revoke закрывает сессию токена.
func (t *RefreshToken) Revoke(now time.Time) {
	t.RevokedAt = &now
}
