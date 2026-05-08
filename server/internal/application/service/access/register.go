package access

import (
	"context"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type RegistrationService struct {
	txManager       transaction.TxManager
	userRepository  repository.UserRepository
	userFactory     *factory.UserFactory
	pwdHasher       password.PasswordHasher
	tokenFactory    *factory.ConfirmationTokenFactory
	tokenRepository repository.ConfirmationTokenRepository
	notifier        service.AccessNotifier
}

func (s *RegistrationService) Execute(ctx context.Context, credentials dto.Credentials) error {
	email := entity.Email(credentials.Email)

	f := func(ctx context.Context) error {
		exist, err := s.userRepository.ExistsByEmail(ctx, email)
		if err != nil {
			return err
		}
		if exist {
			return domain.ErrEmailAlreadyExists("email", credentials.Email)
		}
		hash, err := s.pwdHasher.HashPassword(credentials.Password)
		if err != nil {
			return err
		}
		user := s.userFactory.New(email, hash)

		if err := s.userRepository.Create(ctx, user); err != nil {
			return err
		}
		token := s.tokenFactory.NewToken(user.ID, entity.AccountVerification)
		if err := s.tokenRepository.Create(ctx, token); err != nil {
			return err
		}
		if err := s.notifier.SendAccountConfirmation(user.Email, token.ID); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)

}
