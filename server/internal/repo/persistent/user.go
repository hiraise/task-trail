package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/entity"
	"task-trail/internal/repo"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgUserRepository struct {
	PgRepostitory
}

func NewUserRepo(db *pgxpool.Pool) *PgUserRepository {
	return &PgUserRepository{PgRepostitory{pg: db}}
}

func (r *PgUserRepository) Create(ctx context.Context, user *entity.User) (int, error) {
	query := `
		INSERT INTO users 
		(email, password_hash) 
		VALUES ($1, $2)
		RETURNING id;`
	var id int
	err := r.getDb(ctx).QueryRow(ctx, query, user.Email, user.PasswordHash).Scan(&id)
	if err != nil {
		return 0, r.handleError(err)
	}
	return id, err
}

func (r *PgUserRepository) EmailIsTaken(ctx context.Context, email string) (bool, error) {
	var isTaken bool
	query := `SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)`
	if err := r.getDb(ctx).QueryRow(ctx, query, email).Scan(&isTaken); err != nil {
		return false, r.handleError(err)
	}
	if isTaken {
		return true, nil
	}
	return false, nil
}

func (r *PgUserRepository) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	query := `SELECT id, email, password_hash, verified_at FROM users WHERE email = $1`
	var user entity.User
	if err := r.getDb(ctx).
		QueryRow(ctx, query, email).
		Scan(&user.ID, &user.Email, &user.PasswordHash, &user.VerifiedAt); err != nil {
		return nil, r.handleError(err)
	}
	return &user, nil
}

func (r *PgUserRepository) GetByID(ctx context.Context, ID int) (*entity.User, error) {
	query := `SELECT id, email, password_hash, verified_at FROM users WHERE id = $1`
	var user entity.User
	if err := r.getDb(ctx).
		QueryRow(ctx, query, ID).
		Scan(&user.ID, &user.Email, &user.PasswordHash, &user.VerifiedAt); err != nil {
		return nil, r.handleError(err)
	}
	return &user, nil
}
func (r *PgUserRepository) Update(ctx context.Context, user *entity.User) error {
	kwargs := make(map[string]any)
	if user.Email != "" {
		kwargs["email"] = user.Email
	}
	if user.PasswordHash != "" {
		kwargs["password_hash"] = user.PasswordHash
	}
	if user.VerifiedAt != nil {
		kwargs["verified_at"] = user.VerifiedAt
	}
	if len(kwargs) == 0 {
		return nil
	}

	rows := make([]string, 0, len(kwargs))
	values := make([]any, 0, len(kwargs)+1)
	i := 1
	for k, v := range kwargs {
		rows = append(rows, fmt.Sprintf("%s = $%d", k, i))
		values = append(values, v)
		i++
	}
	values = append(values, user.ID)
	query := fmt.Sprintf("UPDATE users SET %s WHERE id = $%d;", strings.Join(rows, ", "), i)

	tag, err := r.getDb(ctx).Exec(ctx, query, values...)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}
