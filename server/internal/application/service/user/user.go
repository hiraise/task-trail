// Package user holds the user use cases: the current user, their name and avatar,
// other users from their projects.
package user

import (
	"task-trail/internal/application/transaction"
	"task-trail/internal/domain"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"task-trail/internal/domain/service"
)

type UserModule struct {
	Current      *CurrentUserService
	Rename       *RenameService
	UploadAvatar *UploadAvatarService
	Profile      *ProfileService
	// SetEmailNotifications — the switch of notification emails (ADR-0038).
	SetEmailNotifications *SetEmailNotificationsService
}

// Deps are the dependencies of the user module.
type Deps struct {
	TxManager   transaction.TxManager
	Clock       service.Clock
	UserRepo    repository.UserRepository
	FileRepo    repository.FileRepository
	FileFactory *factory.FileFactory
	FileStorage service.FileStorage
}

func New(d Deps) *UserModule {
	return &UserModule{
		Current: &CurrentUserService{userRepository: d.UserRepo},
		Rename: &RenameService{
			txManager:      d.TxManager,
			clock:          d.Clock,
			userRepository: d.UserRepo,
		},
		UploadAvatar: &UploadAvatarService{
			txManager:      d.TxManager,
			clock:          d.Clock,
			userRepository: d.UserRepo,
			fileRepository: d.FileRepo,
			fileFactory:    d.FileFactory,
			storage:        d.FileStorage,
		},
		Profile: &ProfileService{userRepository: d.UserRepo},
		SetEmailNotifications: &SetEmailNotificationsService{
			txManager:      d.TxManager,
			clock:          d.Clock,
			userRepository: d.UserRepo,
		},
	}
}

// sessionUser maps an error reading the current user. If the user was deleted but the access token is still alive,
// the session is invalid: 401, not 404.
func sessionUser(err error, userID string) error {
	if domain.HasCode(err, domain.EntityNotFound) {
		return domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
	}
	return err
}
