package access

import (
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type AccessModule struct {
	Registration         *RegistrationService
	Login                *LoginService
	Verify               *VerifyAccountService
	ResetPassword        *ResetPasswordService
	ConfirmResetPassword *ConfirmResetPasswordService
	Refresh              *RefreshService
	ResendVerification   *ResendVerificationService
	ChangePassword       *ChangePasswordService
	Logout               *LogoutService
}

func New(
	txManager transaction.TxManager,
	userRepo repository.UserRepository,
	userFactory *factory.UserFactory,
	pwdService password.PasswordService,
	confirmTokenFactory *factory.ConfirmationTokenFactory,
	confirmTokenRepo repository.ConfirmationTokenRepository,
	notifier service.AccessNotifier,
	refreshTokenFactory *factory.RefreshTokenFactory,
	refreshTokenRepo repository.RefreshTokenRepository,
	accessTokenService service.AccessTokenService,

) *AccessModule {
	return &AccessModule{
		Registration: &RegistrationService{
			txManager:       txManager,
			userRepository:  userRepo,
			userFactory:     userFactory,
			pwdHasher:       pwdService,
			tokenFactory:    confirmTokenFactory,
			tokenRepository: confirmTokenRepo,
			notifier:        notifier,
		},
		Login: &LoginService{
			txManager:              txManager,
			userRepository:         userRepo,
			refreshTokenRepository: refreshTokenRepo,
			refreshTokenFactory:    refreshTokenFactory,
			pwdComparator:          pwdService,
			tokenService:           accessTokenService,
		},
		Verify: &VerifyAccountService{
			txManager:       txManager,
			userRepository:  userRepo,
			tokenRepository: confirmTokenRepo,
		},
		ResetPassword: &ResetPasswordService{
			txManager:       txManager,
			userRepository:  userRepo,
			tokenFactory:    confirmTokenFactory,
			tokenRepository: confirmTokenRepo,
			notifier:        notifier,
		},
		ConfirmResetPassword: &ConfirmResetPasswordService{
			txManager:       txManager,
			userRepository:  userRepo,
			pwdService:      pwdService,
			tokenRepository: confirmTokenRepo,
		},
		Refresh: &RefreshService{
			txManager:              txManager,
			userRepository:         userRepo,
			refreshTokenRepository: refreshTokenRepo,
			refreshTokenFactory:    refreshTokenFactory,
			pwdComparator:          pwdService,
			tokenService:           accessTokenService,
		},
		ResendVerification: &ResendVerificationService{
			txManager:       txManager,
			userRepository:  userRepo,
			tokenFactory:    confirmTokenFactory,
			tokenRepository: confirmTokenRepo,
			notifier:        notifier,
		},
		ChangePassword: &ChangePasswordService{
			txManager:      txManager,
			userRepository: userRepo,
			pwdService:     pwdService,
		},
		Logout: &LogoutService{
			txManager:              txManager,
			refreshTokenRepository: refreshTokenRepo,
			tokenService:           accessTokenService,
		},
	}
}
