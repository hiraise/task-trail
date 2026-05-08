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

type ResendVerificationService struct {
	txManager       transaction.TxManager
	userRepository  repository.UserRepository
	tokenFactory    *factory.ConfirmationTokenFactory
	tokenRepository repository.ConfirmationTokenRepository
	notifier        service.AccessNotifier
}

func (s *ResendVerificationService) Execute(ctx context.Context, e string) error {
	email := entity.Email(e)

	f := func(ctx context.Context) error {
		user, err := s.userRepository.GetByEmail(ctx, email)
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.EntityNotFound {
					return domain.ErrWrongEmail("email", email)
				}
			}
			return err
		}
		if err := user.CheckVerification(); err == nil {
			return domain.ErrUserAlreadyVerified("userID", user.ID)
		}
		// ban other tokens
		tokens, err := s.tokenRepository.Find(ctx, repository.ConfirmationTokenFilter{
			UserID:         &user.ID,
			ExcludeUsed:    true,
			ExcludeExpired: true,
			Purpose:        entity.AccountVerification,
		})
		if err != nil {
			return err
		}
		if len(tokens) > 0 {
			for _, t := range tokens {
				t.Use()
				err := s.tokenRepository.Update(ctx, t)
				if err != nil {
					return err
				}
			}
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
