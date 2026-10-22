package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// MemberView — a project member together with the user.
type MemberView struct {
	User   *entity.UserAccount
	Member *entity.ProjectMember
}

// ProjectMemberRepository — project membership. Membership in a deleted project (ADR-0001)
// is kept but not found.
type ProjectMemberRepository interface {
	// Add adds a project member; already a member — ENTITY_ALREADY_EXISTS.
	Add(ctx context.Context, member *entity.ProjectMember) error
	// Get — the user's membership in the project; none — ENTITY_NOT_FOUND.
	Get(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) (*entity.ProjectMember, error)
	// List — project members: owner, administrators, members; within a role — in order of joining.
	List(ctx context.Context, projectID entity.ProjectID) ([]*MemberView, error)
	// UpdateRole writes the role and update time.
	UpdateRole(ctx context.Context, member *entity.ProjectMember) error
	Remove(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) error
}
