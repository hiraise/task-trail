package entity_test

import (
	"testing"
	"time"

	"task-trail/internal/domain/entity"
)

func TestRefreshTokenState(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	at := func(d time.Duration) *time.Time { t := now.Add(d); return &t }
	cases := []struct {
		name  string
		token entity.RefreshToken
		want  entity.RefreshTokenState
	}{
		{"действует", entity.RefreshToken{ExpiredAt: now.Add(time.Hour)}, entity.RefreshTokenActive},
		{"истекает ровно сейчас", entity.RefreshToken{ExpiredAt: now}, entity.RefreshTokenExpired},
		{"обменян ровно 30 секунд назад", entity.RefreshToken{ExpiredAt: now.Add(time.Hour), RotatedAt: at(-entity.RefreshTokenReuseGrace)}, entity.RefreshTokenJustRotated},
		{"обменян чуть раньше 30 секунд", entity.RefreshToken{ExpiredAt: now.Add(time.Hour), RotatedAt: at(-entity.RefreshTokenReuseGrace - time.Nanosecond)}, entity.RefreshTokenReused},
		{"сессия закрыта", entity.RefreshToken{ExpiredAt: now.Add(time.Hour), RotatedAt: at(-time.Second), RevokedAt: at(-time.Second)}, entity.RefreshTokenRevoked},
		{"обменян и истёк", entity.RefreshToken{ExpiredAt: now.Add(-time.Second), RotatedAt: at(-time.Hour)}, entity.RefreshTokenExpired},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := c.token.State(now); got != c.want {
				t.Errorf("состояние %d, ожидалось %d", got, c.want)
			}
		})
	}
}

func TestNewEmail(t *testing.T) {
	if got := entity.NewEmail("  Ivan.Petrov@Example.COM\t"); got != "ivan.petrov@example.com" {
		t.Errorf("получено %q", got)
	}
}
