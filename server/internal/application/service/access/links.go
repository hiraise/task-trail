package access

import (
	"context"
	"errors"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/link"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
)

// resetLinkIssuer создаёт ссылку сброса пароля: токен уходит в ссылку, хеш — в базу.
type resetLinkIssuer struct {
	factory            *factory.PasswordResetFactory
	repository         repository.PasswordResetRepository
	settingsRepository repository.SettingsRepository
}

func (i *resetLinkIssuer) issue(ctx context.Context, userID entity.UserID) (dto.ResetLink, *entity.PasswordReset, error) {
	serviceURL, err := i.settingsRepository.GetServiceURL(ctx)
	if err != nil {
		return dto.ResetLink{}, nil, err
	}
	if serviceURL == "" {
		// Адрес задаётся вместе с первым аккаунтом, а без аккаунтов сбрасывать нечего
		return dto.ResetLink{}, nil, errors.New("адрес сервиса не задан")
	}
	token, reset := i.factory.New(userID)
	if err := i.repository.Create(ctx, reset); err != nil {
		return dto.ResetLink{}, nil, err
	}
	return dto.ResetLink{URL: link.PasswordReset(serviceURL, token), ExpiresAt: reset.ExpiredAt}, reset, nil
}
