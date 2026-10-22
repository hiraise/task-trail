package user

import (
	"context"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// ProfileService — другой пользователь, если viewer его видит: у них общий проект или он
// автор задачи в проекте viewer. Остальные — ENTITY_NOT_FOUND: существование не выдаём (ADR-0018).
type ProfileService struct {
	userRepository repository.UserRepository
}

func (s *ProfileService) Execute(ctx context.Context, viewerID, userID string) (*entity.UserAccount, error) {
	return s.userRepository.GetVisible(ctx, entity.UserID(userID), entity.UserID(viewerID))
}
