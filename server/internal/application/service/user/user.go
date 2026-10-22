// Package user — сценарии пользователя: текущий пользователь, его имя и аватарка,
// другие пользователи из его проектов.
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
}

// Deps — зависимости модуля пользователя.
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
	}
}

// sessionUser — ошибка чтения текущего пользователя. Его удалили, а access-токен ещё жив:
// сессия недействительна, это 401, а не 404.
func sessionUser(err error, userID string) error {
	if domain.HasCode(err, domain.EntityNotFound) {
		return domain.ErrWrongAccessToken("userID", userID, "reason", "user not found")
	}
	return err
}
