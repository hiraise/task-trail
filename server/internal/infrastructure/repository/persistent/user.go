package persistent

import (
	"context"
	"errors"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Keys for pg_advisory_xact_lock.
const (
	// registrationLockKey: registration of the first account (ADR-0016).
	registrationLockKey int64 = 0x7461736b_00000001
	// adminsLockKey: granting and revoking service administrators (ADR-0014).
	adminsLockKey int64 = 0x7461736b_00000002
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
	return r.getOne(ctx, `SELECT `+userColumns+` FROM users WHERE email = $1 AND deleted_at IS NULL`, email)
}

func (r *PGUserRepository) GetByID(ctx context.Context, id entity.UserID) (*entity.UserAccount, error) {
	return r.getOne(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1 AND deleted_at IS NULL`, id)
}

func (r *PGUserRepository) GetForUpdate(ctx context.Context, id entity.UserID) (*entity.UserAccount, error) {
	return r.getOne(ctx, `SELECT `+userColumns+` FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, id)
}

// GetVisible: a shared project, or a task authored by the user in a project of viewer — only in non-deleted
// projects (ADR-0001); the author's deleted tasks do not count.
func (r *PGUserRepository) GetVisible(ctx context.Context, id entity.UserID, viewer entity.UserID) (*entity.UserAccount, error) {
	query := `
		SELECT ` + userColumns + `
		FROM users
		WHERE id = $1 AND deleted_at IS NULL AND (
			id = $2
			OR EXISTS (
				SELECT 1
				FROM project_members mine
				JOIN project_members theirs ON theirs.project_id = mine.project_id
				JOIN projects p ON p.id = mine.project_id AND p.deleted_at IS NULL
				WHERE mine.user_id = $2 AND theirs.user_id = users.id
			)
			OR EXISTS (
				SELECT 1
				FROM tasks t
				JOIN project_members mine ON mine.project_id = t.project_id AND mine.user_id = $2
				JOIN projects p ON p.id = t.project_id AND p.deleted_at IS NULL
				WHERE t.author_id = users.id AND t.deleted_at IS NULL
			)
		)`
	return r.getOne(ctx, query, id, viewer)
}

// ListCandidates: people from userID's non-deleted projects, except userID and the members in exclude.
func (r *PGUserRepository) ListCandidates(ctx context.Context, userID entity.UserID, exclude *entity.ProjectID) ([]*entity.UserAccount, error) {
	query := `
		SELECT ` + userColumns + `
		FROM users
		WHERE deleted_at IS NULL AND id <> $1
			AND EXISTS (
				SELECT 1
				FROM project_members mine
				JOIN project_members theirs ON theirs.project_id = mine.project_id
				JOIN projects p ON p.id = mine.project_id AND p.deleted_at IS NULL
				WHERE mine.user_id = $1 AND theirs.user_id = users.id
			)
			AND NOT EXISTS (
				SELECT 1 FROM project_members x WHERE x.project_id = $2::uuid AND x.user_id = users.id
			)
		ORDER BY COALESCE(NULLIF(username, ''), email), email`
	rows, err := r.getDb(ctx).Query(ctx, query, userID, exclude)
	if err != nil {
		return nil, r.handleError(err)
	}
	users, err := ScanRows(rows, func(row pgx.Rows) (*entity.UserAccount, error) { return scanUser(row, r.factory) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return users, nil
}

// userColumns are the user columns for scanUser; userColumnsOf is the same with a table alias.
const userColumns = `id, email, password_hash, username, avatar_id, is_admin, verified_at, created_at, updated_at`

func userColumnsOf(alias string) string {
	return alias + `.id, ` + alias + `.email, ` + alias + `.password_hash, ` + alias + `.username, ` + alias + `.avatar_id, ` +
		alias + `.is_admin, ` + alias + `.verified_at, ` + alias + `.created_at, ` + alias + `.updated_at`
}

// getOne reads one user with a query that selects the userColumns columns.
func (r *PGUserRepository) getOne(ctx context.Context, query string, args ...any) (*entity.UserAccount, error) {
	user, err := scanUser(r.getDb(ctx).QueryRow(ctx, query, args...), r.factory)
	if err != nil {
		return nil, r.handleError(err)
	}
	return user, nil
}

// scanUser reads the userColumns columns and then extra.
func scanUser(row pgx.Row, f *factory.UserFactory, extra ...any) (*entity.UserAccount, error) {
	var id, email, passwordHash string
	var username, avatarID *string
	var isAdmin bool
	var verifiedAt *time.Time
	var createdAt, updatedAt time.Time
	dest := append([]any{&id, &email, &passwordHash, &username, &avatarID, &isAdmin, &verifiedAt, &createdAt, &updatedAt}, extra...)
	if err := row.Scan(dest...); err != nil {
		return nil, err
	}
	return f.Restore(id, email, passwordHash, username, avatarID, isAdmin, verifiedAt, createdAt, updatedAt), nil
}

func (r *PGUserRepository) List(ctx context.Context) ([]*entity.UserAccount, error) {
	rows, err := r.getDb(ctx).Query(ctx, `SELECT `+userColumns+` FROM users WHERE deleted_at IS NULL ORDER BY created_at, id`)
	if err != nil {
		return nil, r.handleError(err)
	}
	users, err := ScanRows(rows, func(row pgx.Rows) (*entity.UserAccount, error) { return scanUser(row, r.factory) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return users, nil
}

func (r *PGUserRepository) CountAdmins(ctx context.Context) (int, error) {
	var count int
	if err := r.getDb(ctx).QueryRow(ctx, `SELECT count(*) FROM users WHERE is_admin AND deleted_at IS NULL`).Scan(&count); err != nil {
		return 0, r.handleError(err)
	}
	return count, nil
}

func (r *PGUserRepository) LockAdmins(ctx context.Context) error {
	return r.advisoryLock(ctx, adminsLockKey, "LockAdmins")
}

func (r *PGUserRepository) Any(ctx context.Context) (bool, error) {
	var exists bool
	if err := r.getDb(ctx).QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM users)`).Scan(&exists); err != nil {
		return false, r.handleError(err)
	}
	return exists, nil
}

func (r *PGUserRepository) LockRegistration(ctx context.Context) error {
	return r.advisoryLock(ctx, registrationLockKey, "LockRegistration")
}

// advisoryLock takes pg_advisory_xact_lock with key until the end of the transaction; method is for the error.
func (r *PGUserRepository) advisoryLock(ctx context.Context, key int64, method string) error {
	if extractTx(ctx) == nil {
		// Outside a transaction the lock is released right after the query and protects nothing
		return domain.ErrRepoInternal(1, errors.New(method+" called outside a transaction"))
	}
	if _, err := r.getDb(ctx).Exec(ctx, `SELECT pg_advisory_xact_lock($1)`, key); err != nil {
		return r.handleError(err)
	}
	return nil
}
