package access

import (
	"context"

	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
	"task-trail/internal/domain/service/password"
)

// ResetPasswordService задаёт пароль по ссылке сброса. Ссылка срабатывает один раз: сброс
// удаляет все ссылки пользователя и закрывает все его сессии.
type ResetPasswordService struct {
	txManager              transaction.TxManager
	clock                  service.Clock
	userRepository         repository.UserRepository
	passwordResetRepo      repository.PasswordResetRepository
	refreshTokenRepository repository.RefreshTokenRepository
	pwdHasher              password.PasswordHasher
}

func (s *ResetPasswordService) Execute(ctx context.Context, data dto.ResetPassword) error {
	hash := entity.HashLinkToken(data.Token)
	now := s.clock.Now()
	f := func(ctx context.Context) error {
		reset, err := s.passwordResetRepo.GetForUpdate(ctx, hash)
		if isEntityNotFound(err) {
			return domain.ErrLinkInvalid("reason", "no such password reset link")
		}
		if err != nil {
			return err
		}
		if reset.IsExpired(now) {
			return domain.ErrLinkInvalid("userID", reset.UserID, "reason", "password reset link expired")
		}
		user, err := s.userRepository.GetForUpdate(ctx, reset.UserID)
		if isEntityNotFound(err) {
			return domain.ErrLinkInvalid("userID", reset.UserID, "reason", "user not found")
		}
		if err != nil {
			return err
		}
		if err := user.ResetPassword(data.Password, s.pwdHasher, now); err != nil {
			return err
		}
		if err := s.userRepository.Update(ctx, user); err != nil {
			return err
		}
		if err := s.passwordResetRepo.DeleteByUser(ctx, user.ID); err != nil {
			return err
		}
		return s.refreshTokenRepository.RevokeAll(ctx, user.ID, now)
	}
	return s.txManager.DoWithTx(ctx, f)
}
