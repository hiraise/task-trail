package access

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service/password"
)

type ConfirmResetPasswordService struct {
	txManager       transaction.TxManager
	userRepository  repository.UserRepository
	pwdService      password.PasswordService
	tokenRepository repository.ConfirmationTokenRepository
}

func (s *ConfirmResetPasswordService) Execute(ctx context.Context, credentials dto.ResetPassword) error {
	f := func(ctx context.Context) error {
		t, err := s.tokenRepository.GetByID(ctx, entity.ConfirmationTokenID(credentials.Token))
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) {
				if e.Code == domain.EntityNotFound {
					return domain.ErrWrongConfirmationToken("tokenID", credentials.Token)
				}
			}
			return err
		}
		if err := t.Validate(); err != nil {
			return err
		}
		u, err := s.userRepository.GetByID(ctx, t.UserID)
		if err != nil {
			return err
		}
		if err := u.ChangePassword(credentials.Password, s.pwdService); err != nil {
			return err
		}
		if err := s.userRepository.Update(ctx, u); err != nil {
			return err
		}
		t.Use()
		if err := s.tokenRepository.Update(ctx, t); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)
}
