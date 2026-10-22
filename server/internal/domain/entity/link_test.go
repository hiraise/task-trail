package entity_test

import (
	"encoding/hex"
	"testing"
	"time"

	"task-trail/internal/domain/entity"
)

// The database keeps the SHA-256 of the token (ADR-0016): links are looked up by the hash, the token itself is not stored.
func TestHashLinkToken(t *testing.T) {
	got := hex.EncodeToString(entity.HashLinkToken("abc"))
	if got != "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" {
		t.Errorf("hash %s", got)
	}
}

func TestLinkExpiry(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	reset := entity.PasswordReset{CreatedAt: now.Add(-24 * time.Hour), ExpiredAt: now}
	if !reset.IsExpired(now) || reset.IsExpired(now.Add(-time.Nanosecond)) {
		t.Error("a reset link expires exactly at ExpiredAt")
	}
	if reset.Lifetime() != 24*time.Hour {
		t.Errorf("lifetime %s", reset.Lifetime())
	}
	invitation := entity.Invitation{ExpiredAt: now}
	if !invitation.IsExpired(now) || invitation.IsExpired(now.Add(-time.Nanosecond)) {
		t.Error("an invitation expires exactly at ExpiredAt")
	}
}

// By an invitation a person joins as a member (ADR-0016).
func TestInvitationMembership(t *testing.T) {
	now := time.Date(2026, 10, 21, 12, 0, 0, 0, time.UTC)
	invitation := entity.Invitation{ProjectID: "p", Email: "ivan@example.com", InvitedBy: "owner"}
	got := *invitation.Membership("ivan", now)
	want := entity.ProjectMember{ProjectID: "p", UserID: "ivan", Role: entity.RoleMember, CreatedAt: now, UpdatedAt: now}
	if got != want {
		t.Errorf("membership %+v", got)
	}
}

func TestDisplayName(t *testing.T) {
	name, empty := "Иван", ""
	for username, want := range map[*string]string{&name: "Иван", &empty: "ivan@example.com", nil: "ivan@example.com"} {
		if got := entity.DisplayName(username, "ivan@example.com"); got != want {
			t.Errorf("got %q, want %q", got, want)
		}
	}
}
