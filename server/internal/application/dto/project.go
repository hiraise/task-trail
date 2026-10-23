package dto

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

type CreateProject struct {
	Name        string
	Description *string
	// Key is already trimmed and upper-cased (ADR-0026).
	Key string
	// Emails are whom to invite right away, as in AddMembers.
	Emails []string
}

// ProjectChanges is what to change in a project: Name and Key if not nil; the description
// if DescriptionSet, nil in Description removes the description.
type ProjectChanges struct {
	Name           *string
	Key            *string
	DescriptionSet bool
	Description    *string
}

// InvitationOutcome is what happened to an email invited to a project (InvitationResult in the contract).
type InvitationOutcome string

const (
	// InvitationAdded: the account exists, the person became a member.
	InvitationAdded InvitationOutcome = "added"
	// InvitationInvited: there is no account, an invitation was created.
	InvitationInvited InvitationOutcome = "invited"
	// InvitationAlreadyMember: the person is already a member.
	InvitationAlreadyMember InvitationOutcome = "already_member"
	// InvitationMailFailed: the invitation was created but the email was not sent: a repeated invitation
	// sends a new one (ADR-0017).
	InvitationMailFailed InvitationOutcome = "mail_failed"
)

type InvitationResult struct {
	Email   entity.Email
	Outcome InvitationOutcome
	// InviteURL is the invitation link, only with InvitationInvited and mail disabled:
	// the inviter passes it on themselves (ADR-0017).
	InviteURL *string
}

type ProjectCreated struct {
	Project     *repository.ProjectView
	Invitations []InvitationResult
}
