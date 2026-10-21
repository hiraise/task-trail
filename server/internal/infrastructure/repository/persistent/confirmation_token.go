package persistent

import (
	"context"
	"fmt"
	"strings"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGConfirmationTokenRepository struct {
	PgRepository
	factory *factory.ConfirmationTokenFactory
}

func NewConfirmationTokenRepo(db *pgxpool.Pool, factory *factory.ConfirmationTokenFactory) *PGConfirmationTokenRepository {
	return &PGConfirmationTokenRepository{factory: factory, PgRepository: PgRepository{pg: db}}
}

func (r *PGConfirmationTokenRepository) Create(ctx context.Context, entity *entity.ConfirmationToken) error {
	return r.insert(ctx, "confirmation_tokens", map[string]any{
		"id":         entity.ID,
		"user_id":    entity.UserID,
		"purpose":    entity.Purpose,
		"expired_at": entity.ExpiredAt,
	})
}

func (r *PGConfirmationTokenRepository) Update(ctx context.Context, entity *entity.ConfirmationToken) error {
	query := `
		UPDATE confirmation_tokens
		SET used_at = $1
		WHERE id = $2`

	tag, err := r.getDb(ctx).Exec(ctx, query, entity.UsedAt, entity.ID)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil)
	}
	return nil
}

func (r *PGConfirmationTokenRepository) GetByID(ctx context.Context, tokenID entity.ConfirmationTokenID) (*entity.ConfirmationToken, error) {
	query := `
		SELECT purpose, expired_at, used_at, user_id
		FROM confirmation_tokens 
		WHERE id = $1
		`
	var purpose, userID string
	var expiredAt time.Time
	var usedAt *time.Time
	if err := r.getDb(ctx).
		QueryRow(ctx, query, tokenID).
		Scan(&purpose, &expiredAt, &usedAt, &userID); err != nil {
		return nil, r.handleError(err)
	}
	return r.factory.Restore(string(tokenID), userID, purpose, expiredAt, usedAt), nil
}

func (repo *PGConfirmationTokenRepository) Find(ctx context.Context, filter repository.ConfirmationTokenFilter) ([]*entity.ConfirmationToken, error) {
	f := []string{}

	selectArgs := "id, purpose, expired_at, used_at, user_id"
	tableName := pgx.Identifier{"confirmation_tokens"}.Sanitize()
	args := make(pgx.NamedArgs, 5)
	if filter.ID != nil {
		f = append(f, "id = @id")
		args["id"] = string(*filter.ID)
	}
	if filter.ExcludeExpired {
		f = append(f, "expired_at > @expired_at")
		args["expired_at"] = time.Now()
	}
	if filter.ExcludeUsed {
		f = append(f, "used_at IS NULL")
	}
	f = append(f, "purpose = @purpose")
	args["purpose"] = filter.Purpose
	query := fmt.Sprintf(
		"SELECT %s FROM %s WHERE %s",
		selectArgs,
		tableName,
		strings.Join(f, " AND "),
	)

	rows, err := repo.getDb(ctx).Query(ctx, query, args)
	if err != nil {
		return nil, repo.handleError(err)
	}
	return ScanRows(rows, func(r pgx.Rows) (*entity.ConfirmationToken, error) {
		var purpose, userID, id string
		var expiredAt time.Time
		var usedAt *time.Time
		if err := rows.Scan(&id, &purpose, &expiredAt, &usedAt, &userID); err != nil {
			return nil, err
		}
		return repo.factory.Restore(id, userID, purpose, expiredAt, usedAt), nil
	})

}
