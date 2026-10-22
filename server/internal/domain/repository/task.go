package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

// TaskRepository — задачи. Удалённая задача (ADR-0001) не находится ни одним методом.
// Задачи меняются только под блокировкой их проекта (ProjectRepository.GetForUpdate):
// так изменения одной задачи не затирают друг друга, а исполнитель не расходится
// с участниками проекта.
type TaskRepository interface {
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id entity.TaskID) (*entity.Task, error)
	// ListInProject — задачи проекта, новые первыми.
	ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Task, error)
	// ListAssigned — задачи, где userID исполнитель, в проектах, где он участник; новые первыми.
	ListAssigned(ctx context.Context, userID entity.UserID) ([]*entity.Task, error)
	// Update записывает всё, что меняют операции с задачей: проект, название, описание,
	// статус, исполнителя и время изменения.
	Update(ctx context.Context, task *entity.Task) error
	SoftDelete(ctx context.Context, id entity.TaskID, now time.Time) error
	// UnassignInProject снимает пользователя с задач проекта: исключённый или вышедший
	// участник больше не исполнитель (контракт, removeProjectMember и leaveProject).
	UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) error
}
