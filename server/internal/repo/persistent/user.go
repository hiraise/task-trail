package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/repo"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgUserRepository struct {
	PgRepostitory
}

func NewUserRepo(db *pgxpool.Pool) *PgUserRepository {
	return &PgUserRepository{PgRepostitory{pg: db}}
}

func (r *PgUserRepository) Create(ctx context.Context, dto *dto.UserCreate) (int, error) {
	substring := `
		(email, password_hash) 
		VALUES ($1, $2)`
	args := []any{dto.Email, dto.PasswordHash}
	if dto.IsVerified {
		substring = `
			(email, password_hash, verified_at) 
			VALUES ($1, $2, $3)`
		args = append(args, time.Now())
	}
	var id int
	err := r.getDb(ctx).QueryRow(
		ctx,
		fmt.Sprintf(`INSERT INTO users %s RETURNING id;`, substring),
		args...,
	).Scan(&id)
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

func (r *PgUserRepository) GetByEmail(ctx context.Context, email string) (*dto.User, error) {
	return r.getOne(ctx, "email", email)
}

func (r *PgUserRepository) GetByID(ctx context.Context, ID int) (*dto.User, error) {
	return r.getOne(ctx, "id", ID)
}

func (r *PgUserRepository) getOne(ctx context.Context, fieldName string, value any) (*dto.User, error) {
	var user dto.User
	query := fmt.Sprintf(`
		SELECT id, email, password_hash, verified_at, username, avatar_id 
		FROM users 
		WHERE %s = $1
		`,
		fieldName,
	)
	if err := r.getDb(ctx).
		QueryRow(ctx, query, value).
		Scan(&user.ID, &user.Email, &user.PasswordHash, &user.VerifiedAt, &user.Username, &user.AvatarID); err != nil {
		return nil, r.handleError(err)
	}
	return &user, nil
}
func (r *PgUserRepository) Update(ctx context.Context, dto *dto.UserUpdate) error {
	kwargs := make(map[string]any)
	if dto.Email != "" {
		kwargs["email"] = dto.Email
	}
	if dto.PasswordHash != "" {
		kwargs["password_hash"] = dto.PasswordHash
	}
	if !dto.VerifiedAt.IsZero() {
		kwargs["verified_at"] = dto.VerifiedAt
	}
	if dto.AvatarID != "" {
		kwargs["avatar_id"] = dto.AvatarID
	}
	if dto.Username != "" {
		kwargs["username"] = dto.Username
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
	values = append(values, dto.ID)
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

func (r *PgUserRepository) GetIdsByEmails(ctx context.Context, emails []string) ([]*dto.UserEmailAndID, error) {
	var items []string
	values := make([]any, 0, len(emails)+1)
	for i, email := range emails {
		values = append(values, email)
		items = append(items, fmt.Sprintf("$%d", i+1))
	}
	query := fmt.Sprintf("SELECT id, email FROM users WHERE email IN (%s);", strings.Join(items, ","))
	rows, err := r.getDb(ctx).Query(ctx, query, values...)
	if err != nil {
		return nil, r.handleError(err)
	}
	defer rows.Close()

	var retVal []*dto.UserEmailAndID
	for rows.Next() {
		var item dto.UserEmailAndID
		if err := rows.Scan(&item.ID, &item.Email); err != nil {
			return nil, r.handleError(err)
		}
		retVal = append(retVal, &item)
	}
	if err := rows.Err(); err != nil {
		return nil, r.handleError(err)
	}
	return retVal, nil
}
