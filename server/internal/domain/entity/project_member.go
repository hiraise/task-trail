package entity

import (
	"time"

	"task-trail/internal/domain"
)

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

// NewMember — участие человека, которого позвали в проект: он приходит участником,
// роль меняют потом (ADR-0016).
func NewMember(projectID ProjectID, userID UserID, now time.Time) *ProjectMember {
	return &ProjectMember{ProjectID: projectID, UserID: userID, Role: RoleMember, CreatedAt: now, UpdatedAt: now}
}

// Права в проекте — по роли (ADR-0003). Проверки ниже отвечают FORBIDDEN тому, кто участник
// проекта; не участник до них не доходит — для него проекта нет (404, ADR-0018).

// RequireManager — менять проект и звать людей могут владелец и администратор.
func (m *ProjectMember) RequireManager() error {
	if m.Role == RoleOwner || m.Role == RoleAdmin {
		return nil
	}
	return m.forbidden("owner or admin required")
}

// RequireOwner — удалять проект и менять роли может только владелец.
func (m *ProjectMember) RequireOwner() error {
	if m.Role == RoleOwner {
		return nil
	}
	return m.forbidden("owner required")
}

// ChangeRoleOf меняет роль target: владелец назначает администратора или участника.
// Роль владельца не передаётся и не отнимается — так у проекта всегда один владелец.
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

// CheckRemove — владелец исключает любого, кроме себя; администратор — только участников
// с ролью «участник».
func (m *ProjectMember) CheckRemove(target *ProjectMember) error {
	switch {
	case m.Role == RoleOwner && target.Role != RoleOwner:
		return nil
	case m.Role == RoleAdmin && target.Role == RoleMember:
		return nil
	}
	return m.forbidden("cannot remove this member", "targetID", target.UserID, "targetRole", target.Role)
}

// CheckLeave — выйти может администратор или участник; владелец не выходит, а удаляет проект.
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
