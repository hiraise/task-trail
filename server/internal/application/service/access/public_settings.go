package access

import (
	"context"
	"task-trail/internal/application/dto"
	"task-trail/internal/domain/repository"
)

// PublicSettingsService отдаёт вебу до входа, открыта ли регистрация и включена ли почта:
// веб прячет недоступные действия (ADR-0017).
type PublicSettingsService struct {
	userRepository     repository.UserRepository
	settingsRepository repository.SettingsRepository
}

func (s *PublicSettingsService) Execute(ctx context.Context) (dto.PublicSettings, error) {
	exists, err := s.userRepository.Any(ctx)
	if err != nil {
		return dto.PublicSettings{}, err
	}
	mail, err := s.settingsRepository.GetMail(ctx)
	if err != nil {
		return dto.PublicSettings{}, err
	}
	return dto.PublicSettings{RegistrationOpen: !exists, MailEnabled: mail != nil}, nil
}
