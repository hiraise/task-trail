package persistent

import (
	"context"
	"fmt"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

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
		"verified_at":   entity.VerifiedAt,
	})
}

func (r *PGUserRepository) Update(ctx context.Context, entity *entity.UserAccount) error {
	query := `
		UPDATE users
		SET email = $1, password_hash = $2, verified_at = $3, updated_at = $4
		WHERE id = $5 AND deleted_at IS NULL`

	tag, err := r.getDb(ctx).Exec(ctx, query, entity.Email, entity.PasswordHash, entity.VerifiedAt, time.Now(), entity.ID)
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
		SELECT id, email, password_hash, verified_at
		FROM users 
		WHERE %s = $1 AND deleted_at IS NULL
		`,
		fieldName,
	)
	var id, email string
	var passwordHash *string
	var verifiedAt *time.Time

	if err := r.getDb(ctx).
		QueryRow(ctx, query, value).
		Scan(&id, &email, &passwordHash, &verifiedAt); err != nil {
		return nil, r.handleError(err)
	}
	return r.factory.Restore(id, email, passwordHash, verifiedAt), nil
}

func (r *PGUserRepository) ExistsByEmail(ctx context.Context, email entity.Email) (bool, error) {
	var exists bool
	query := `SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)`
	if err := r.getDb(ctx).QueryRow(ctx, query, email).Scan(&exists); err != nil {
		return false, r.handleError(err)
	}
	if exists {
		return true, nil
	}
	return false, nil
}
