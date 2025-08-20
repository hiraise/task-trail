package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PgUserRepository struct {
	PgRepostitory
}

func NewUserRepo(db *pgxpool.Pool) *PgUserRepository {
	return &PgUserRepository{PgRepostitory{pg: db}}
}

func (r *PgUserRepository) Create(ctx context.Context, dto *dto.UserCreate) (int, error) {
	query := `
		INSERT INTO users
		(email, password_hash, verified_at) 
		VALUES ($1, $2, $3)
		RETURNING id`
	var id int
	err := r.getDb(ctx).QueryRow(
		ctx,
		query,
		dto.Email, dto.PasswordHash, dto.VerifiedAt,
	).Scan(&id)
	if err != nil {
		return 0, r.handleError(err)
	}
	return id, err
}

func (r *PgUserRepository) CreateBulk(ctx context.Context, data []*dto.UserCreate) ([]*dto.UserEmailAndID, error) {

	var substrings []string
	var values []any
	index := 1
	for _, item := range data {
		values = append(values, item.Email, item.PasswordHash, item.VerifiedAt)
		substrings = append(substrings, fmt.Sprintf("($%d, $%d, $%d)", index, index+1, index+2))
		index += 3
	}

	rows, err := r.getDb(ctx).Query(
		ctx,
		fmt.Sprintf(`
			INSERT INTO users (email, password_hash, verified_at)
			VALUES
			%s 
			RETURNING id, email;`, strings.Join(substrings, ",\n")),
		values...,
	)
	if err != nil {
		return nil, r.handleError(err)
	}

	items, err := ScanRows(rows, func(row pgx.Rows) (*dto.UserEmailAndID, error) {
		var item dto.UserEmailAndID
		if err := row.Scan(
			&item.ID,
			&item.Email,
		); err != nil {
			return nil, err
		}
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return items, nil
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
	return r.updateByID(ctx, "users", dto.ID, kwargs)
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

func (r *PgUserRepository) Delete(ctx context.Context, userID int) error {
	if err := r.updateByID(ctx, "users", userID, map[string]any{"deleted_at": time.Now()}); err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PgUserRepository) GetTasks(ctx context.Context, userID int) ([]*dto.TaskListRes, error) {
	if err := ValidateID(userID, "userID"); err != nil {
		return nil, err
	}

	query := `
		SELECT t.id, t.name, t.description, t.created_at, t.updated_at, t.author_id, t.assignee_id, t.status_id, t.project_id
		FROM tasks as t 
		WHERE t.assignee_id = $1 AND t.deleted_at IS NULL;
	`
	rows, err := r.getDb(ctx).Query(ctx, query, userID)
	if err != nil {
		return nil, r.handleError(err)
	}

	retVal, err := ScanRows(rows, func(row pgx.Rows) (*dto.TaskListRes, error) {
		var item dto.TaskListRes
		if err := row.Scan(
			&item.ID,
			&item.Name,
			&item.Description,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.AuthorID,
			&item.AssigneeID,
			&item.StatusID,
			&item.ProjectID,
		); err != nil {
			return nil, err
		}
		return &item, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return retVal, nil
}
