package access

import (
	"context"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// AdminCheckService checks that the user is a service administrator. The server checks rights
// in every administration endpoint; the web only hides the section (ADR-0014).
type AdminCheckService struct {
	userRepository repository.UserRepository
}

func (s *AdminCheckService) Execute(ctx context.Context, userID string) error {
	user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
	if isEntityNotFound(err) {
		// The user was deleted but the access token is still alive: the session is invalid
		return domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
	}
	if err != nil {
		return err
	}
	if !user.IsAdmin {
		return domain.ErrForbidden("userID", userID, "reason", "not a service administrator")
	}
	return nil
}
