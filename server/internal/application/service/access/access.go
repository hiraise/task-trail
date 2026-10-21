package access

import (
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type AccessModule struct {
	Registration   *RegistrationService
	Login          *LoginService
	Refresh        *RefreshService
	Logout         *LogoutService
	ChangePassword *ChangePasswordService
	PublicSettings *PublicSettingsService
	Cleanup        *CleanupService
}

// Deps — зависимости модуля доступа.
type Deps struct {
	TxManager           transaction.TxManager
	Clock               service.Clock
	UserRepo            repository.UserRepository
	UserFactory         *factory.UserFactory
	PasswordService     password.PasswordService
	RefreshTokenFactory *factory.RefreshTokenFactory
	RefreshTokenRepo    repository.RefreshTokenRepository
	AccessTokenService  service.AccessTokenService
	SettingsRepo        repository.SettingsRepository
}

func New(d Deps) *AccessModule {
	sessions := &sessionOpener{
		factory:      d.RefreshTokenFactory,
		repository:   d.RefreshTokenRepo,
		tokenService: d.AccessTokenService,
	}
	return &AccessModule{
		Registration: &RegistrationService{
			txManager:          d.TxManager,
			userRepository:     d.UserRepo,
			userFactory:        d.UserFactory,
			pwdHasher:          d.PasswordService,
			settingsRepository: d.SettingsRepo,
			sessions:           sessions,
		},
		Login: &LoginService{
			txManager:      d.TxManager,
			userRepository: d.UserRepo,
			pwdComparator:  d.PasswordService,
			sessions:       sessions,
		},
		Refresh: &RefreshService{
			txManager:              d.TxManager,
			clock:                  d.Clock,
			refreshTokenRepository: d.RefreshTokenRepo,
			tokenService:           d.AccessTokenService,
			sessions:               sessions,
		},
		Logout: &LogoutService{
			txManager:              d.TxManager,
			clock:                  d.Clock,
			refreshTokenRepository: d.RefreshTokenRepo,
			tokenService:           d.AccessTokenService,
		},
		ChangePassword: &ChangePasswordService{
			txManager:      d.TxManager,
			clock:          d.Clock,
			userRepository: d.UserRepo,
			pwdService:     d.PasswordService,
		},
		PublicSettings: &PublicSettingsService{
			userRepository:     d.UserRepo,
			settingsRepository: d.SettingsRepo,
		},
		Cleanup: &CleanupService{
			clock:                  d.Clock,
			refreshTokenRepository: d.RefreshTokenRepo,
		},
	}
}
