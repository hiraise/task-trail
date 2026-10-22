package access

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// PasswordResetLinkService выдаёт ссылку сброса без письма (ADR-0017): администратор — для
// любого пользователя, команда сервера — для любой почты, на случай, когда ни один
// администратор не может войти. Ссылку человеку передают сами.
type PasswordResetLinkService struct {
	userRepository repository.UserRepository
	links          *resetLinkIssuer
}

// ForEmail возвращает ENTITY_NOT_FOUND, если пользователя с такой почтой нет.
func (s *PasswordResetLinkService) ForEmail(ctx context.Context, email string) (dto.ResetLink, error) {
	user, err := s.userRepository.GetByEmail(ctx, entity.NewEmail(email))
	if err != nil {
		return dto.ResetLink{}, err
	}
	link, _, err := s.links.issue(ctx, user.ID)
	return link, err
}

// ForUser возвращает ENTITY_NOT_FOUND, если такого пользователя нет. Права администратора
// проверяет middleware.NewAdmin (ADR-0014).
func (s *PasswordResetLinkService) ForUser(ctx context.Context, userID string) (dto.ResetLink, error) {
	user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
	if err != nil {
		return dto.ResetLink{}, err
	}
	link, _, err := s.links.issue(ctx, user.ID)
	return link, err
}
