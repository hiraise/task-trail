package entity

import "time"

type ProjectID string

// ProjectRole — роль в проекте (ADR-0003); набор ролей фиксирован.
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
