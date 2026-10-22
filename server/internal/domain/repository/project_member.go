package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

// MemberView — участник проекта вместе с пользователем.
type MemberView struct {
	User   *entity.UserAccount
	Member *entity.ProjectMember
}

// ProjectMemberRepository — участие в проектах. Участие в удалённом проекте (ADR-0001)
// хранится, но не находится.
type ProjectMemberRepository interface {
	// Add добавляет участника проекта; уже участник — ENTITY_ALREADY_EXISTS.
	Add(ctx context.Context, member *entity.ProjectMember) error
	// Get — участие пользователя в проекте; нет — ENTITY_NOT_FOUND.
	Get(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) (*entity.ProjectMember, error)
	// List — участники проекта: владелец, администраторы, участники; внутри роли — в порядке вступления.
	List(ctx context.Context, projectID entity.ProjectID) ([]*MemberView, error)
	// UpdateRole записывает роль и время изменения.
	UpdateRole(ctx context.Context, member *entity.ProjectMember) error
	Remove(ctx context.Context, projectID entity.ProjectID, userID entity.UserID) error
}
