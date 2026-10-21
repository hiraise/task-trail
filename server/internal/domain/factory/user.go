package factory

import (
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/service"
	"time"
)

type UserFactory struct {
	idGenerator service.IDGenerator
}

func NewUserFactory(idGenerator service.IDGenerator) *UserFactory {
	return &UserFactory{idGenerator: idGenerator}
}

func (f *UserFactory) New(email entity.Email, passwordHash string) *entity.UserAccount {
	return &entity.UserAccount{
		ID:           entity.UserID(f.idGenerator.Generate()),
		Email:        email,
		PasswordHash: &passwordHash,
		VerifiedAt:   nil,
	}
}

func (f *UserFactory) NewRegistered(email entity.Email) *entity.UserAccount {
	t := time.Now()
	return &entity.UserAccount{
		ID:           entity.UserID(f.idGenerator.Generate()),
		Email:        email,
		PasswordHash: nil,
		VerifiedAt:   &t,
	}
}

func (f *UserFactory) Restore(id string, email string, passwordHash *string, verifiedAt *time.Time) *entity.UserAccount {
	return &entity.UserAccount{
		ID:           entity.UserID(id),
		Email:        entity.Email(email),
		PasswordHash: passwordHash,
		VerifiedAt:   verifiedAt,
	}
}
