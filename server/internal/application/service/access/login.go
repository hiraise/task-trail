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

type LoginService struct {
	txManager      transaction.TxManager
	userRepository repository.UserRepository
	pwdComparator  password.PasswordComparator
	sessions       *sessionOpener
}

func (s *LoginService) Execute(ctx context.Context, credentials dto.Credentials) (dto.Session, error) {
	email := entity.NewEmail(credentials.Email)
	var session dto.Session
	f := func(ctx context.Context) error {
		user, err := s.userRepository.GetByEmail(ctx, email)
		if err != nil {
			var e *domain.DomainError
			if errors.As(err, &e) && e.Code == domain.EntityNotFound {
				return domain.ErrInvalidCredentials("email", email, "reason", "no such user")
			}
			return err
		}
		equal, err := s.pwdComparator.ComparePassword(credentials.Password, user.PasswordHash)
		if err != nil {
			return err
		}
		if !equal {
			return domain.ErrInvalidCredentials("email", email, "reason", "wrong password")
		}
		tokens, err := s.sessions.open(ctx, user.ID)
		if err != nil {
			return err
		}
		session = dto.Session{User: user, Tokens: tokens}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.Session{}, err
	}
	return session, nil
}
