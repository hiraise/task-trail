package access

import (
	"context"
	"errors"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type ResetPasswordService struct {
	txManager       transaction.TxManager
	userRepository  repository.UserRepository
	tokenFactory    *factory.ConfirmationTokenFactory
	tokenRepository repository.ConfirmationTokenRepository
	notifier        service.AccessNotifier
}

func (s *ResetPasswordService) Execute(ctx context.Context, email string) error {

	f := func(ctx context.Context) error {
		u, err := s.userRepository.GetByEmail(ctx, entity.Email(email))
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.EntityNotFound {
					return domain.ErrWrongEmail("email", email)
				}
			}
			return err
		}
		if err := u.CheckVerification(); err != nil {
			return err
		}
		token := s.tokenFactory.NewToken(u.ID, entity.ResetPasswordConfirmation)
		if err := s.tokenRepository.Create(ctx, token); err != nil {
			return err
		}
		if err := s.notifier.SendPasswordResetConfirmation(u.Email, token.ID); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)
}
