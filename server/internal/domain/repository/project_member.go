package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type ProjectMemberRepository interface {
	// Add добавляет участника проекта; уже участник — ENTITY_ALREADY_EXISTS.
	Add(ctx context.Context, member *entity.ProjectMember) error
}
