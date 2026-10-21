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

type ChangePasswordService struct {
	txManager      transaction.TxManager
	clock          service.Clock
	userRepository repository.UserRepository
	pwdService     password.PasswordService
}

func (s *ChangePasswordService) Execute(ctx context.Context, userID string, passwords dto.ChangePassword) error {
	f := func(ctx context.Context) error {
		user, err := s.userRepository.GetForUpdate(ctx, entity.UserID(userID))
		if isEntityNotFound(err) {
			// Пользователя удалили, а access-токен ещё жив: сессия недействительна
			return domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
		}
		if err != nil {
			return err
		}
		if err := user.VerifyOldPassword(passwords.OldPassword, s.pwdService); err != nil {
			return err
		}
		if err := user.ChangePassword(passwords.NewPassword, s.pwdService, s.clock.Now()); err != nil {
			return err
		}
		return s.userRepository.Update(ctx, user)
	}
	return s.txManager.DoWithTx(ctx, f)
}
