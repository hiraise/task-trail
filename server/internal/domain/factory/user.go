package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type UserFactory struct {
	idGenerator service.IDGenerator
	clock       service.Clock
}

func NewUserFactory(idGenerator service.IDGenerator, clock service.Clock) *UserFactory {
	return &UserFactory{idGenerator: idGenerator, clock: clock}
}

// New создаёт аккаунт сразу подтверждённым: подтверждения почты нет (ADR-0016).
func (f *UserFactory) New(email entity.Email, passwordHash string, username string) *entity.UserAccount {
	now := f.clock.Now()
	return &entity.UserAccount{
		ID:           entity.UserID(f.idGenerator.Generate()),
		Email:        email,
		PasswordHash: passwordHash,
		Username:     &username,
		VerifiedAt:   &now,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

func (f *UserFactory) Restore(
	id string,
	email string,
	passwordHash string,
	username *string,
	avatarID *string,
	isAdmin bool,
	verifiedAt *time.Time,
	createdAt time.Time,
	updatedAt time.Time,
) *entity.UserAccount {
	var avatar *entity.FileID
	if avatarID != nil {
		fileID := entity.FileID(*avatarID)
		avatar = &fileID
	}
	return &entity.UserAccount{
		ID:           entity.UserID(id),
		Email:        entity.Email(email),
		PasswordHash: passwordHash,
		Username:     username,
		AvatarID:     avatar,
		IsAdmin:      isAdmin,
		VerifiedAt:   verifiedAt,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}
}
