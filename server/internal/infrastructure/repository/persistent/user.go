package persistent

import (
	"context"
	"errors"
	"fmt"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// registrationLockKey — ключ pg_advisory_xact_lock для регистрации первого аккаунта (ADR-0016).
const registrationLockKey int64 = 0x7461736b_00000001

type PGUserRepository struct {
	PgRepository
	factory *factory.UserFactory
}

func NewUserRepo(db *pgxpool.Pool, factory *factory.UserFactory) *PGUserRepository {
	return &PGUserRepository{factory: factory, PgRepository: PgRepository{pg: db}}
}

func (r *PGUserRepository) Create(ctx context.Context, entity *entity.UserAccount) error {
	return r.insert(ctx, "users", map[string]any{
		"id":            entity.ID,
		"email":         entity.Email,
		"password_hash": entity.PasswordHash,
		"username":      entity.Username,
		"avatar_id":     entity.AvatarID,
		"is_admin":      entity.IsAdmin,
		"verified_at":   entity.VerifiedAt,
		"created_at":    entity.CreatedAt,
		"updated_at":    entity.UpdatedAt,
	})
}

func (r *PGUserRepository) Update(ctx context.Context, entity *entity.UserAccount) error {
	query := `
		UPDATE users
		SET email = $1, password_hash = $2, username = $3, avatar_id = $4, is_admin = $5,
			verified_at = $6, updated_at = $7
		WHERE id = $8 AND deleted_at IS NULL`

	tag, err := r.getDb(ctx).Exec(ctx, query, entity.Email, entity.PasswordHash, entity.Username, entity.AvatarID,
		entity.IsAdmin, entity.VerifiedAt, entity.UpdatedAt, entity.ID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil)
	}
	return nil
}

func (r *PGUserRepository) GetByEmail(ctx context.Context, email entity.Email) (*entity.UserAccount, error) {
	return r.getOne(ctx, "email", email)
}

func (r *PGUserRepository) GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error) {
	return r.getOne(ctx, "id", id)
}

func (r *PGUserRepository) getOne(ctx context.Context, fieldName string, value any) (*entity.UserAccount, error) {
	query := fmt.Sprintf(`
		SELECT id, email, password_hash, username, avatar_id, is_admin, verified_at, created_at, updated_at
		FROM users
		WHERE %s = $1 AND deleted_at IS NULL
		`,
		fieldName,
	)
	var id, email, passwordHash string
	var username, avatarID *string
	var isAdmin bool
	var verifiedAt *time.Time
	var createdAt, updatedAt time.Time

	if err := r.getDb(ctx).
		QueryRow(ctx, query, value).
		Scan(&id, &email, &passwordHash, &username, &avatarID, &isAdmin, &verifiedAt, &createdAt, &updatedAt); err != nil {
		return nil, r.handleError(err)
	}
	return r.factory.Restore(id, email, passwordHash, username, avatarID, isAdmin, verifiedAt, createdAt, updatedAt), nil
}

func (r *PGUserRepository) Any(ctx context.Context) (bool, error) {
	var exists bool
	if err := r.getDb(ctx).QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users)`).Scan(&exists); err != nil {
		return false, r.handleError(err)
	}
	return exists, nil
}

func (r *PGUserRepository) LockRegistration(ctx context.Context) error {
	if extractTx(ctx) == nil {
		// Вне транзакции блокировка снимется сразу после запроса и ничего не защитит
		return domain.ErrRepoInternal(0, errors.New("LockRegistration вызван вне транзакции"))
	}
	if _, err := r.getDb(ctx).Exec(ctx, `SELECT pg_advisory_xact_lock($1)`, registrationLockKey); err != nil {
		return r.handleError(err)
	}
	return nil
}
