package access

import (
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type AccessModule struct {
	Registration      *RegistrationService
	Login             *LoginService
	Refresh           *RefreshService
	Logout            *LogoutService
	ChangePassword    *ChangePasswordService
	ForgotPassword    *ForgotPasswordService
	ResetPassword     *ResetPasswordService
	PasswordResetLink *PasswordResetLinkService
	InvitationLookup  *InvitationLookupService
	AcceptInvitation  *AcceptInvitationService
	AdminCheck        *AdminCheckService
	PublicSettings    *PublicSettingsService
	Cleanup           *CleanupService
}

// Deps are the dependencies of the access module.
type Deps struct {
	TxManager            transaction.TxManager
	Clock                service.Clock
	UserRepo             repository.UserRepository
	UserFactory          *factory.UserFactory
	PasswordService      password.PasswordService
	RefreshTokenFactory  *factory.RefreshTokenFactory
	RefreshTokenRepo     repository.RefreshTokenRepository
	AccessTokenService   service.AccessTokenService
	SettingsRepo         repository.SettingsRepository
	PasswordResetFactory *factory.PasswordResetFactory
	PasswordResetRepo    repository.PasswordResetRepository
	InvitationRepo       repository.InvitationRepository
	ProjectMemberRepo    repository.ProjectMemberRepository
	Mailer               service.Mailer
}

func New(d Deps) *AccessModule {
	sessions := &sessionOpener{
		factory:      d.RefreshTokenFactory,
		repository:   d.RefreshTokenRepo,
		tokenService: d.AccessTokenService,
	}
	resetLinks := &resetLinkIssuer{
		factory:            d.PasswordResetFactory,
		repository:         d.PasswordResetRepo,
		settingsRepository: d.SettingsRepo,
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
		ForgotPassword: &ForgotPasswordService{
			userRepository:     d.UserRepo,
			settingsRepository: d.SettingsRepo,
			links:              resetLinks,
			mailer:             d.Mailer,
		},
		ResetPassword: &ResetPasswordService{
			txManager:              d.TxManager,
			clock:                  d.Clock,
			userRepository:         d.UserRepo,
			passwordResetRepo:      d.PasswordResetRepo,
			refreshTokenRepository: d.RefreshTokenRepo,
			pwdHasher:              d.PasswordService,
		},
		PasswordResetLink: &PasswordResetLinkService{
			userRepository: d.UserRepo,
			links:          resetLinks,
		},
		InvitationLookup: &InvitationLookupService{
			clock:                d.Clock,
			invitationRepository: d.InvitationRepo,
			userRepository:       d.UserRepo,
		},
		AcceptInvitation: &AcceptInvitationService{
			txManager:            d.TxManager,
			clock:                d.Clock,
			invitationRepository: d.InvitationRepo,
			memberRepository:     d.ProjectMemberRepo,
			userRepository:       d.UserRepo,
			userFactory:          d.UserFactory,
			pwdHasher:            d.PasswordService,
			sessions:             sessions,
		},
		AdminCheck: &AdminCheckService{
			userRepository: d.UserRepo,
		},
		PublicSettings: &PublicSettingsService{
			userRepository:     d.UserRepo,
			settingsRepository: d.SettingsRepo,
		},
		Cleanup: &CleanupService{
			clock:                  d.Clock,
			refreshTokenRepository: d.RefreshTokenRepo,
			passwordResetRepo:      d.PasswordResetRepo,
			invitationRepository:   d.InvitationRepo,
		},
	}
}
