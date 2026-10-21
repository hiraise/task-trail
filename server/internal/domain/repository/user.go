package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type UserRepository interface {
	Create(ctx context.Context, entity *entity.UserAccount) error
	Update(ctx context.Context, entity *entity.UserAccount) error
	GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	GetByEmail(ctx context.Context, email entity.Email) (*entity.UserAccount, error)
	// Any сообщает, есть ли в сервисе хоть один пользователь, включая удалённых:
	// регистрация открыта, только пока их нет (ADR-0016).
	Any(ctx context.Context) (bool, error)
	// LockRegistration до конца транзакции не пускает другую регистрацию первого аккаунта
	// (ADR-0016): без блокировки два запроса в READ COMMITTED создадут двух «первых».
	// Вне транзакции — ошибка.
	LockRegistration(ctx context.Context) error
}
