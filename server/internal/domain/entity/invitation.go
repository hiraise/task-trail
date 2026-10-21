package entity

import "time"

type InvitationID string

// Invitation — приглашение в проект почты, у которой ещё нет аккаунта (ADR-0016).
// Пользователь до принятия не создаётся.
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

// Lifetime — сколько приглашение действует с момента создания: срок называет письмо.
func (i *Invitation) Lifetime() time.Duration {
	return i.ExpiredAt.Sub(i.CreatedAt)
}

// Membership — участие в проекте, которым становится приглашение: по приглашению человек
// приходит участником, роль меняют потом (ADR-0016).
func (i *Invitation) Membership(userID UserID, now time.Time) *ProjectMember {
	return &ProjectMember{ProjectID: i.ProjectID, UserID: userID, Role: RoleMember, CreatedAt: now, UpdatedAt: now}
}
