package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type UserRepository interface {
	Create(ctx context.Context, entity *entity.UserAccount) error
	// Update записывает пользователя целиком. Прочитай его через GetForUpdate в той же
	// транзакции, иначе параллельное изменение (пароль, имя, аватарка) затрётся.
	Update(ctx context.Context, entity *entity.UserAccount) error
	GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	// GetForUpdate читает пользователя и блокирует его строку до конца транзакции.
	GetForUpdate(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	GetByEmail(ctx context.Context, email entity.Email) (*entity.UserAccount, error)
	// GetVisible находит пользователя, которого видит viewer: это он сам, у них есть общий
	// проект или пользователь — автор задачи в проекте viewer. Так автор задачи виден
	// и после выхода из проекта (контракт, GET /v1/users/{userId}). Остальные не находятся.
	GetVisible(ctx context.Context, id entity.UserID, viewer entity.UserID) (*entity.UserAccount, error)
	// ListCandidates — кого userID может позвать в проект: люди из его неудалённых проектов,
	// кроме него самого, а если задан exclude — и кроме участников этого проекта.
	ListCandidates(ctx context.Context, userID entity.UserID, exclude *entity.ProjectID) ([]*entity.UserAccount, error)
	// Any сообщает, есть ли в сервисе хоть один пользователь, включая удалённых:
	// регистрация открыта, только пока их нет (ADR-0016).
	Any(ctx context.Context) (bool, error)
	// LockRegistration до конца транзакции не пускает другую регистрацию первого аккаунта
	// (ADR-0016): без блокировки два запроса в READ COMMITTED создадут двух «первых».
	// Вне транзакции — ошибка.
	LockRegistration(ctx context.Context) error
}
