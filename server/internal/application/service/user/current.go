package user

import (
	"context"

	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// CurrentUserService returns the signed-in user.
type CurrentUserService struct {
	userRepository repository.UserRepository
}

func (s *CurrentUserService) Execute(ctx context.Context, userID string) (*entity.UserAccount, error) {
	user, err := s.userRepository.GetByID(ctx, entity.UserID(userID))
	if err != nil {
		return nil, sessionUser(err, userID)
	}
	return user, nil
}

// RenameService changes the current user's name; nil removes the name.
type RenameService struct {
	txManager      transaction.TxManager
	clock          service.Clock
	userRepository repository.UserRepository
}

func (s *RenameService) Execute(ctx context.Context, userID string, username *string) (*entity.UserAccount, error) {
	var user *entity.UserAccount
	f := func(ctx context.Context) error {
		u, err := s.userRepository.GetForUpdate(ctx, entity.UserID(userID))
		if err != nil {
			return sessionUser(err, userID)
		}
		u.Rename(username, s.clock.Now())
		if err := s.userRepository.Update(ctx, u); err != nil {
			return err
		}
		user = u
		return nil
	}
	if err := s.txManager.DoWithTx(ctx, f); err != nil {
		return nil, err
	}
	return user, nil
}
