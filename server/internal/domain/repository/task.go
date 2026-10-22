package repository

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"
)

type TaskRepository interface {
	// UnassignInProject снимает пользователя с задач проекта: исключённый или вышедший
	// участник больше не исполнитель (контракт, removeProjectMember и leaveProject).
	UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) error
}
