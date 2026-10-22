package user

import (
	"context"

	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// ProfileService returns another user if viewer can see them: they share a project or the user is
// the author of a task in viewer's project. Others: ENTITY_NOT_FOUND, existence is not revealed (ADR-0018).
type ProfileService struct {
	userRepository repository.UserRepository
}

func (s *ProfileService) Execute(ctx context.Context, viewerID, userID string) (*entity.UserAccount, error) {
	return s.userRepository.GetVisible(ctx, entity.UserID(userID), entity.UserID(viewerID))
}
