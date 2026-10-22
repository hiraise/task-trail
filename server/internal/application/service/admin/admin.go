// Package admin is the service administration (ADR-0014): the service address and mail (ADR-0015,
// ADR-0017), users and administrators. Administrator rights are checked by middleware.NewAdmin
// before the use case; a password reset link for a user is issued by the access module
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

// Deps are the dependencies of the administration module.
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

// current returns the service settings as the administrator sees them: a change responds
// with the changed resource (ADR-0018).
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
