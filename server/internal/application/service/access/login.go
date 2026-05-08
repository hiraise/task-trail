package access

import (
	"context"
	"errors"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

type LoginService struct {
	txManager              transaction.TxManager
	userRepository         repository.UserRepository
	refreshTokenRepository repository.RefreshTokenRepository
	refreshTokenFactory    *factory.RefreshTokenFactory
	pwdComparator          password.PasswordComparator
	tokenService           service.AccessTokenService
}

func (s *LoginService) Execute(ctx context.Context, credentials dto.Credentials) (dto.SuccessLogin, error) {

	email := entity.Email(credentials.Email)
	var retVal *dto.SuccessLogin
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
		if err := user.HasPassword(); err != nil {
			return err
		}
		if err := user.CheckVerification(); err != nil {
			return err
		}
		equal, err := s.pwdComparator.ComparePassword(credentials.Password, *user.PasswordHash)
		if err != nil {
			return err
		}
		if !equal {
			return domain.ErrWrongPassword("email", email)
		}

		refreshToken := s.refreshTokenFactory.NewToken(user.ID)
		err = s.refreshTokenRepository.Create(ctx, refreshToken)
		if err != nil {
			return err
		}
		at, rt, err := s.tokenService.GenerateTokensPair(user.ID, refreshToken)
		if err != nil {
			return err
		}
		retVal = &dto.SuccessLogin{
			AccessToken:  at,
			RefreshToken: rt,
			UserID:       string(user.ID),
		}
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return dto.SuccessLogin{}, err
	}
	return *retVal, nil
}
