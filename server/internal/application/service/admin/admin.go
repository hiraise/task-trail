// Package admin — администрирование сервиса (ADR-0014): адрес сервиса и почта (ADR-0015,
// ADR-0017), пользователи и администраторы. Права администратора проверяет middleware.NewAdmin
// до сценария, ссылку сброса пароля для пользователя выдаёт модуль доступа
// (access.PasswordResetLinkService.ForUser).
package admin

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type AdminModule struct {
	Settings         *GetSettingsService
	UpdateServiceURL *UpdateServiceURLService
	SaveMail         *SaveMailService
	DisableMail      *DisableMailService
	SendTestMail     *SendTestMailService
	Users            *ListUsersService
	SetAdmin         *SetAdminService
}

// Deps — зависимости модуля администрирования.
type Deps struct {
	TxManager    transaction.TxManager
	Clock        service.Clock
	UserRepo     repository.UserRepository
	SettingsRepo repository.SettingsRepository
	Mailer       service.Mailer
}

func New(d Deps) *AdminModule {
	return &AdminModule{
		Settings:         &GetSettingsService{settings: d.SettingsRepo},
		UpdateServiceURL: &UpdateServiceURLService{settings: d.SettingsRepo},
		SaveMail:         &SaveMailService{settings: d.SettingsRepo, mailer: d.Mailer},
		DisableMail:      &DisableMailService{settings: d.SettingsRepo},
		SendTestMail:     &SendTestMailService{users: d.UserRepo, settings: d.SettingsRepo, mailer: d.Mailer},
		Users:            &ListUsersService{users: d.UserRepo},
		SetAdmin:         &SetAdminService{txManager: d.TxManager, clock: d.Clock, users: d.UserRepo},
	}
}

// current — настройки сервиса, какими их видит администратор: изменение отвечает
// изменённым ресурсом (ADR-0018).
func current(ctx context.Context, settings repository.SettingsRepository) (dto.ServiceSettings, error) {
	serviceURL, err := settings.GetServiceURL(ctx)
	if err != nil {
		return dto.ServiceSettings{}, err
	}
	mail, err := settings.GetMail(ctx)
	if err != nil {
		return dto.ServiceSettings{}, err
	}
	return dto.ServiceSettings{ServiceURL: serviceURL, Mail: mail}, nil
}
