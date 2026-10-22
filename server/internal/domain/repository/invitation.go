package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// InvitationDetails — an invitation and what a person sees by its link.
type InvitationDetails struct {
	Invitation      *entity.Invitation
	ProjectName     string
	InviterUsername *string
	InviterEmail    entity.Email
}

type InvitationRepository interface {
	// Create saves an invitation. An invitation of the same email to the same project replaces
	// the previous one, and the old link stops working (ADR-0016).
	Create(ctx context.Context, invitation *entity.Invitation) error
	// GetByTokenHash finds an invitation by the link token hash. Invitations of a deleted
	// project are not valid (ADR-0001) and are not found.
	GetByTokenHash(ctx context.Context, hash entity.LinkTokenHash) (*InvitationDetails, error)
	// ListByEmail — invitations of the email to non-deleted projects, expired ones included.
	ListByEmail(ctx context.Context, email entity.Email) ([]*entity.Invitation, error)
	// DeleteExpired deletes invitations expired by now and returns how many were deleted.
	DeleteExpired(ctx context.Context, now time.Time) (int64, error)
}
