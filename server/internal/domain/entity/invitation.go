package entity

import "time"

type InvitationID string

// Invitation — an invitation to a project for an email that has no account yet (ADR-0016).
// The user is not created until acceptance.
type Invitation struct {
	ID        InvitationID
	ProjectID ProjectID
	Email     Email
	InvitedBy UserID
	TokenHash LinkTokenHash
	ExpiredAt time.Time
	CreatedAt time.Time
}

func (i *Invitation) IsExpired(now time.Time) bool {
	return !now.Before(i.ExpiredAt)
}

// Lifetime — how long the invitation is valid from creation: the letter states the term.
func (i *Invitation) Lifetime() time.Duration {
	return i.ExpiredAt.Sub(i.CreatedAt)
}

// Membership — the project membership the invitation turns into (NewMember).
func (i *Invitation) Membership(userID UserID, now time.Time) *ProjectMember {
	return NewMember(i.ProjectID, userID, now)
}
