package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// ProjectView — проект, каким его видит участник: с числом задач и ролью участника.
type ProjectView struct {
	Project *entity.Project
	// TasksCount — задачи проекта, кроме удалённых.
	TasksCount int
	Role       entity.ProjectRole
}

// ProjectRepository — проекты. Удалённый проект (ADR-0001) не находится ни одним методом.
type ProjectRepository interface {
	Create(ctx context.Context, project *entity.Project) error
	// GetForUpdate блокирует строку проекта до конца транзакции. Сценарии, которые меняют
	// проект или его участников, начинают с неё: так проверка роли и само действие
	// не разойдутся с параллельным изменением.
	GetForUpdate(ctx context.Context, id entity.ProjectID) (*entity.Project, error)
	// GetView — проект глазами участника userID; не участник — ENTITY_NOT_FOUND.
	GetView(ctx context.Context, id entity.ProjectID, userID entity.UserID) (*ProjectView, error)
	// ListViews — проекты, где userID участник, новые первыми.
	ListViews(ctx context.Context, userID entity.UserID) ([]*ProjectView, error)
	// Update записывает название, описание и время изменения.
	Update(ctx context.Context, project *entity.Project) error
	// SoftDelete помечает удалёнными проект и его задачи; участие в проекте остаётся (ADR-0001).
	SoftDelete(ctx context.Context, id entity.ProjectID, now time.Time) error
}
