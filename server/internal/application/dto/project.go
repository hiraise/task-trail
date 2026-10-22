package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

type CreateProject struct {
	Name        string
	Description *string
	// Emails — кого позвать сразу, как в AddMembers.
	Emails []string
}

// ProjectChanges — что поменять в проекте: Name — если не nil; описание — если DescriptionSet,
// nil в Description убирает описание.
type ProjectChanges struct {
	Name           *string
	DescriptionSet bool
	Description    *string
}

// InvitationOutcome — что стало с почтой, которую позвали в проект (InvitationResult в контракте).
type InvitationOutcome string

const (
	// InvitationAdded — аккаунт есть, человек стал участником.
	InvitationAdded InvitationOutcome = "added"
	// InvitationInvited — аккаунта нет, создано приглашение.
	InvitationInvited InvitationOutcome = "invited"
	// InvitationAlreadyMember — человек уже участник.
	InvitationAlreadyMember InvitationOutcome = "already_member"
	// InvitationMailFailed — приглашение создано, а письмо не ушло: повторное приглашение
	// отправит новое (ADR-0017).
	InvitationMailFailed InvitationOutcome = "mail_failed"
)

type InvitationResult struct {
	Email   entity.Email
	Outcome InvitationOutcome
	// InviteURL — ссылка приглашения, только при InvitationInvited и выключенной почте:
	// её передаёт сам пригласивший (ADR-0017).
	InviteURL *string
}

type ProjectCreated struct {
	Project     *repository.ProjectView
	Invitations []InvitationResult
}
