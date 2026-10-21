package access

import (
	"context"
	"errors"
	"net/url"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
)

// Страницы веба, которые открывают ссылки из писем и ответов API. Адреса — в контракте,
// в описании токенов: веб читает токен из параметра token.
const (
	passwordResetPath = "/auth/reset"
	invitationPath    = "/auth/invite"
)

// buildLink строит ссылку на страницу веба от адреса сервиса (ADR-0015).
func buildLink(serviceURL, path, token string) string {
	return serviceURL + path + "?token=" + url.QueryEscape(token)
}

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
	return dto.ResetLink{URL: buildLink(serviceURL, passwordResetPath, token), ExpiresAt: reset.ExpiredAt}, reset, nil
}
