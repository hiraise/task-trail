package access

import (
	"context"
	"task-trail/internal/application/dto"
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service/password"
)

type ChangePasswordService struct {
	txManager      transaction.TxManager
	userRepository repository.UserRepository
	pwdService     password.PasswordService
}

func (s *ChangePasswordService) Execute(ctx context.Context, userID string, passwords dto.ChangePassword) error {

	f := func(ctx context.Context) error {
		user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
		if err != nil {
			// case: when user has been deactivated/banned/deleted or, but access tokens still alive
			return err
		}
		if err := user.VerifyOldPassword(passwords.OldPassword, s.pwdService); err != nil {
			return err
		}
		if err := user.ChangePassword(passwords.NewPassword, s.pwdService); err != nil {
			return err
		}
		if err := s.userRepository.Update(ctx, user); err != nil {
			return err
		}
		return nil
	}
	return s.txManager.DoWithTx(ctx, f)
}
