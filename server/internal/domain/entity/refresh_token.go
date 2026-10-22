package entity

import (
	"time"
)

type RefreshTokenID string

// RefreshTokenReuseGrace — how long an exchanged refresh token is still accepted: this is how long
// a parallel request from another tab with the same cookie takes. Later use of it is theft
// (contract, POST /v1/auth/refresh).
const RefreshTokenReuseGrace = 30 * time.Second

type RefreshToken struct {
	ID        RefreshTokenID
	UserID    UserID
	ExpiredAt time.Time
	// RotatedAt — when the token was exchanged for a new pair.
	RotatedAt *time.Time
	// RevokedAt — when the session was closed: sign-out or revocation of all the user's tokens.
	RevokedAt *time.Time
}

type RefreshTokenState int

const (
	// RefreshTokenActive — the token is valid.
	RefreshTokenActive RefreshTokenState = iota
	// RefreshTokenJustRotated — the token was exchanged no more than RefreshTokenReuseGrace ago:
	// a parallel request also gets a new pair.
	RefreshTokenJustRotated
	// RefreshTokenReused — an exchanged token came after the window: someone else has a copy,
	// revoke all the user's tokens.
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

// Rotate marks that the token was exchanged for a new pair.
func (t *RefreshToken) Rotate(now time.Time) {
	t.RotatedAt = &now
}

// Revoke closes the token's session.
func (t *RefreshToken) Revoke(now time.Time) {
	t.RevokedAt = &now
}
