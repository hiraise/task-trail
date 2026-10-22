package entity_test

import (
	"encoding/hex"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
)

// В базе — SHA-256 токена (ADR-0016): по хешу ищется ссылка, сам токен не хранится.
func TestHashLinkToken(t *testing.T) {
	got := hex.EncodeToString(entity.HashLinkToken("abc"))
	if got != "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" {
		t.Errorf("хеш %s", got)
	}
}

func TestLinkExpiry(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	reset := entity.PasswordReset{CreatedAt: now.Add(-24 * time.Hour), ExpiredAt: now}
	if !reset.IsExpired(now) || reset.IsExpired(now.Add(-time.Nanosecond)) {
		t.Error("ссылка сброса истекает ровно в ExpiredAt")
	}
	if reset.Lifetime() != 24*time.Hour {
		t.Errorf("срок %s", reset.Lifetime())
	}
	invitation := entity.Invitation{ExpiredAt: now}
	if !invitation.IsExpired(now) || invitation.IsExpired(now.Add(-time.Nanosecond)) {
		t.Error("приглашение истекает ровно в ExpiredAt")
	}
}

// По приглашению человек приходит участником (ADR-0016).
func TestInvitationMembership(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	invitation := entity.Invitation{ProjectID: "p", Email: "ivan@example.com", InvitedBy: "owner"}
	got := *invitation.Membership("ivan", now)
	want := entity.ProjectMember{ProjectID: "p", UserID: "ivan", Role: entity.RoleMember, CreatedAt: now, UpdatedAt: now}
	if got != want {
		t.Errorf("участие %+v", got)
	}
}

func TestDisplayName(t *testing.T) {
	name, empty := "Иван", ""
	for username, want := range map[*string]string{&name: "Иван", &empty: "ivan@example.com", nil: "ivan@example.com"} {
		if got := entity.DisplayName(username, "ivan@example.com"); got != want {
			t.Errorf("получено %q, ожидалось %q", got, want)
		}
	}
}
