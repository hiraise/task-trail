package entity

import (
	"time"

	"task-trail/internal/domain"
)

type ProjectID string

// ProjectRole — a role in a project (ADR-0003); the set of roles is fixed.
type ProjectRole string

const (
	RoleOwner  ProjectRole = "owner"
	RoleAdmin  ProjectRole = "admin"
	RoleMember ProjectRole = "member"
)

type ProjectMember struct {
	ProjectID ProjectID
	UserID    UserID
	Role      ProjectRole
	CreatedAt time.Time
	UpdatedAt time.Time
}

// NewMember — membership of a person invited to a project: they join as a member,
// the role is changed later (ADR-0016).
func NewMember(projectID ProjectID, userID UserID, now time.Time) *ProjectMember {
	return &ProjectMember{ProjectID: projectID, UserID: userID, Role: RoleMember, CreatedAt: now, UpdatedAt: now}
}

// Project permissions follow the role (ADR-0003). The checks below answer FORBIDDEN to a project
// member; a non-member never reaches them — for them the project does not exist (404, ADR-0018).

// RequireManager — the owner and administrators can change the project and invite people.
func (m *ProjectMember) RequireManager() error {
	if m.Role == RoleOwner || m.Role == RoleAdmin {
		return nil
	}
	return m.forbidden("owner or admin required")
}

// RequireOwner — only the owner can delete the project and change roles.
func (m *ProjectMember) RequireOwner() error {
	if m.Role == RoleOwner {
		return nil
	}
	return m.forbidden("owner required")
}

// ChangeRoleOf changes the role of target: the owner makes them an administrator or a member.
// The owner role is neither handed over nor taken away — so a project always has one owner.
func (m *ProjectMember) ChangeRoleOf(target *ProjectMember, role ProjectRole, now time.Time) error {
	if err := m.RequireOwner(); err != nil {
		return err
	}
	if target.Role == RoleOwner || role == RoleOwner {
		return m.forbidden("owner role is not transferable", "targetID", target.UserID, "newRole", role)
	}
	target.Role = role
	target.UpdatedAt = now
	return nil
}

// CheckRemove — the owner removes anyone except themselves; an administrator — only members
// with the "member" role.
func (m *ProjectMember) CheckRemove(target *ProjectMember) error {
	switch {
	case m.Role == RoleOwner && target.Role != RoleOwner:
		return nil
	case m.Role == RoleAdmin && target.Role == RoleMember:
		return nil
	}
	return m.forbidden("cannot remove this member", "targetID", target.UserID, "targetRole", target.Role)
}

// CheckLeave — an administrator or a member can leave; the owner does not leave but deletes the project.
func (m *ProjectMember) CheckLeave() error {
	if m.Role == RoleOwner {
		return domain.ErrOwnerCannotLeave("projectID", m.ProjectID, "userID", m.UserID)
	}
	return nil
}

func (m *ProjectMember) forbidden(reason string, data ...any) error {
	return domain.NewErr(3, domain.Forbidden, nil,
		append([]any{"projectID", m.ProjectID, "userID", m.UserID, "role", m.Role, "reason", reason}, data...)...)
}
