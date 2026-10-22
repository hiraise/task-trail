package admin

import (
	"context"

	"task-trail/internal/application/transaction"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

// ListUsersService returns all users of the service, by registration date (ADR-0014).
type ListUsersService struct {
	users repository.UserRepository
}

func (s *ListUsersService) Execute(ctx context.Context) ([]*entity.UserAccount, error) {
	return s.users.List(ctx)
}

// SetAdminService grants and revokes service administrator rights (ADR-0014). The last one cannot
// be revoked: counting and revoking run under UserRepository.LockAdmins. The user row
// is locked so that a parallel name or password change does not overwrite the flag.
type SetAdminService struct {
	txManager transaction.TxManager
	clock     service.Clock
	users     repository.UserRepository
}

// Execute returns ENTITY_NOT_FOUND if there is no such user.
func (s *SetAdminService) Execute(ctx context.Context, userID string, isAdmin bool) (*entity.UserAccount, error) {
	var user *entity.UserAccount
	f := func(ctx context.Context) error {
		if err := s.users.LockAdmins(ctx); err != nil {
			return err
		}
		u, err := s.users.GetForUpdate(ctx, entity.UserID(userID))
		if err != nil {
			return err
		}
		admins, err := s.users.CountAdmins(ctx)
		if err != nil {
			return err
		}
		if err := u.SetAdmin(isAdmin, admins, s.clock.Now()); err != nil {
			return err
		}
		if err := s.users.Update(ctx, u); err != nil {
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
