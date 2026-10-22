package access

import (
	"context"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

// AdminCheckService проверяет, что пользователь — администратор сервиса. Права проверяет
// сервер в каждом эндпоинте администрирования, веб только прячет раздел (ADR-0014).
type AdminCheckService struct {
	userRepository repository.UserRepository
}

func (s *AdminCheckService) Execute(ctx context.Context, userID string) error {
	user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
	if isEntityNotFound(err) {
		// Пользователя удалили, а access-токен ещё жив: сессия недействительна
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
