package access

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// PasswordResetLinkService issues a reset link without an email (ADR-0017): the administrator for
// any user, a server command for any email, in case no
// administrator can sign in. The link is passed to the person manually.
type PasswordResetLinkService struct {
	userRepository repository.UserRepository
	links          *resetLinkIssuer
}

// ForEmail returns ENTITY_NOT_FOUND if there is no user with this email.
func (s *PasswordResetLinkService) ForEmail(ctx context.Context, email string) (dto.ResetLink, error) {
	user, err := s.userRepository.GetByEmail(ctx, entity.NewEmail(email))
	if err != nil {
		return dto.ResetLink{}, err
	}
	link, _, err := s.links.issue(ctx, user.ID)
	return link, err
}

// ForUser returns ENTITY_NOT_FOUND if there is no such user. Administrator rights
// are checked by middleware.NewAdmin (ADR-0014).
func (s *PasswordResetLinkService) ForUser(ctx context.Context, userID string) (dto.ResetLink, error) {
	user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
	if err != nil {
		return dto.ResetLink{}, err
	}
	link, _, err := s.links.issue(ctx, user.ID)
	return link, err
}
