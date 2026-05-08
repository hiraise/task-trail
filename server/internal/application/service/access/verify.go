package access

import (
	"context"
	"errors"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
)

type VerifyAccountService struct {
	txManager       transaction.TxManager
	userRepository  repository.UserRepository
	tokenRepository repository.ConfirmationTokenRepository
}

func (s *VerifyAccountService) Execute(ctx context.Context, tokenID string) error {
	id := entity.ConfirmationTokenID(tokenID)
	f := func(ctx context.Context) error {
		token, err := s.tokenRepository.GetByID(ctx, id)
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.EntityNotFound {
					return domain.ErrWrongConfirmationToken("tokenID", tokenID)
				}
			}
			return err
		}
		if err := token.Validate(); err != nil {
			return err
		}
		user, err := s.userRepository.GetByID(ctx, token.UserID)
		if err != nil {
			return err
		}
		if err := user.Verify(); err != nil {
			return err
		}
		token.Use()
		if err := s.userRepository.Update(ctx, user); err != nil {
			return err
		}

		if err := s.tokenRepository.Update(ctx, token); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)

}
