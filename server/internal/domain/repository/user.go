package repository

import (
	"context"
	"task-trail/internal/domain/entity"
)

type UserRepository interface {
	Create(ctx context.Context, entity *entity.UserAccount) error
	// Update writes the whole user. Read it via GetForUpdate in the same
	// transaction, otherwise a parallel change (password, name, avatar) is overwritten.
	Update(ctx context.Context, entity *entity.UserAccount) error
	GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	// GetForUpdate reads the user and locks its row until the end of the transaction.
	GetForUpdate(ctx context.Context, id entity.UserID) (*entity.UserAccount, error)
	GetByEmail(ctx context.Context, email entity.Email) (*entity.UserAccount, error)
	// GetVisible finds a user the viewer can see: the viewer themselves, a user sharing a
	// project, or the author of a task in a project of the viewer. This way a task author stays visible
	// after leaving the project (contract, GET /v1/users/{userId}). Others are not found.
	GetVisible(ctx context.Context, id entity.UserID, viewer entity.UserID) (*entity.UserAccount, error)
	// ListCandidates — whom userID can invite to a project: people from their non-deleted projects,
	// except themselves, and if exclude is set — except members of that project too.
	ListCandidates(ctx context.Context, userID entity.UserID, exclude *entity.ProjectID) ([]*entity.UserAccount, error)
	// List — all service users for the administrator (ADR-0014), by registration date:
	// earliest first.
	List(ctx context.Context) ([]*entity.UserAccount, error)
	// CountAdmins — how many administrators the service has (ADR-0014).
	CountAdmins(ctx context.Context) (int, error)
	// LockAdmins blocks another administrator grant or removal until the end of the transaction
	// (ADR-0014): without the lock two concurrent removals would leave the service without administrators.
	// Outside a transaction — an error.
	LockAdmins(ctx context.Context) error
	// Any reports whether the service has at least one user, deleted ones included:
	// registration is open only while there are none (ADR-0016).
	Any(ctx context.Context) (bool, error)
	// LockRegistration blocks another registration of the first account until the end of the transaction
	// (ADR-0016): without the lock two requests in READ COMMITTED would create two "first" ones.
	// Outside a transaction — an error.
	LockRegistration(ctx context.Context) error
}
