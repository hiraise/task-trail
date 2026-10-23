package persistent

import (
	"context"
	"errors"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGProjectRepository struct {
	PgRepository
}

func NewProjectRepo(db *pgxpool.Pool) *PGProjectRepository {
	return &PGProjectRepository{PgRepository: PgRepository{pg: db}}
}

// uqProjectsKey — the unique index of keys of non-deleted projects (migration 000006).
const uqProjectsKey = "uq_projects_key"

func (r *PGProjectRepository) Create(ctx context.Context, p *entity.Project) error {
	err := r.insert(ctx, "projects", map[string]any{
		"id":          p.ID,
		"name":        p.Name,
		"description": p.Description,
		"key":         p.Key,
		"archived_at": p.ArchivedAt,
		"created_at":  p.CreatedAt,
		"updated_at":  p.UpdatedAt,
	})
	return keyTaken(err, p)
}

// keyTaken turns a violation of uqProjectsKey into PROJECT_KEY_TAKEN and leaves other errors as they are.
func keyTaken(err error, p *entity.Project) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == uqProjectsKey {
		return domain.ErrProjectKeyTaken(err, "projectID", p.ID, "key", p.Key)
	}
	return err
}

const projectColumns = `p.id, p.name, p.description, p.key, p.archived_at, p.created_at, p.updated_at`

func (r *PGProjectRepository) GetForUpdate(ctx context.Context, id entity.ProjectID) (*entity.Project, error) {
	query := `SELECT ` + projectColumns + ` FROM projects p WHERE p.id = $1 AND p.deleted_at IS NULL FOR UPDATE`
	project, err := scanProject(r.getDb(ctx).QueryRow(ctx, query, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return project, nil
}

// projectViews selects projects as member $1 sees them: the number of tasks neither deleted nor archived
// on their own (ADR-0027) and the member's role.
const projectViews = `
	SELECT ` + projectColumns + `,
		(SELECT count(*) FROM tasks t WHERE t.project_id = p.id AND t.deleted_at IS NULL AND t.archived_at IS NULL),
		m.role
	FROM projects p
	JOIN project_members m ON m.project_id = p.id AND m.user_id = $1
	WHERE p.deleted_at IS NULL`

func (r *PGProjectRepository) GetView(ctx context.Context, id entity.ProjectID, userID entity.UserID) (*repository.ProjectView, error) {
	view, err := scanProjectView(r.getDb(ctx).QueryRow(ctx, projectViews+` AND p.id = $2`, userID, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return view, nil
}

func (r *PGProjectRepository) ListViews(ctx context.Context, userID entity.UserID, archived bool) ([]*repository.ProjectView, error) {
	query := projectViews + ` AND (p.archived_at IS NOT NULL) = $2 ORDER BY p.created_at DESC, p.id`
	return r.listViews(ctx, query, userID, archived)
}

func (r *PGProjectRepository) Search(ctx context.Context, userID entity.UserID, pattern string, limit int) ([]*repository.ProjectView, error) {
	query := projectViews + ` AND (p.name ILIKE $2 ESCAPE '\' OR p.key ILIKE $2 ESCAPE '\') ORDER BY p.name, p.id LIMIT $3`
	return r.listViews(ctx, query, userID, pattern, limit)
}

func (r *PGProjectRepository) listViews(ctx context.Context, query string, args ...any) ([]*repository.ProjectView, error) {
	rows, err := r.getDb(ctx).Query(ctx, query, args...)
	if err != nil {
		return nil, r.handleError(err)
	}
	views, err := ScanRows(rows, func(row pgx.Rows) (*repository.ProjectView, error) { return scanProjectView(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return views, nil
}

func (r *PGProjectRepository) Update(ctx context.Context, p *entity.Project) error {
	tag, err := r.getDb(ctx).Exec(ctx,
		`UPDATE projects SET name = $2, description = $3, key = $4, archived_at = $5, updated_at = $6
		WHERE id = $1 AND deleted_at IS NULL`,
		p.ID, p.Name, p.Description, p.Key, p.ArchivedAt, p.UpdatedAt)
	if err != nil {
		return keyTaken(r.handleError(err), p)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "projectID", p.ID)
	}
	return nil
}

func (r *PGProjectRepository) NextTaskNumber(ctx context.Context, id entity.ProjectID) (int, error) {
	var number int
	err := r.getDb(ctx).QueryRow(ctx,
		`UPDATE projects SET task_counter = task_counter + 1 WHERE id = $1 AND deleted_at IS NULL RETURNING task_counter`,
		id).Scan(&number)
	if err != nil {
		return 0, r.handleError(err)
	}
	return number, nil
}

// SoftDelete marks the project and its tasks in one query: either everything is deleted or nothing.
func (r *PGProjectRepository) SoftDelete(ctx context.Context, id entity.ProjectID, now time.Time) error {
	query := `
		WITH project AS (
			UPDATE projects SET deleted_at = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id
		), deleted_tasks AS (
			UPDATE tasks SET deleted_at = $2 WHERE project_id IN (SELECT id FROM project) AND deleted_at IS NULL
		)
		SELECT count(*) FROM project`
	var deleted int
	if err := r.getDb(ctx).QueryRow(ctx, query, id, now).Scan(&deleted); err != nil {
		return r.handleError(err)
	}
	if deleted == 0 {
		return domain.ErrEntityNotFound(2, nil, "projectID", id)
	}
	return nil
}

// scanProject reads the projectColumns columns and then extra.
func scanProject(row pgx.Row, extra ...any) (*entity.Project, error) {
	var id, key string
	p := &entity.Project{}
	if err := row.Scan(append([]any{&id, &p.Name, &p.Description, &key, &p.ArchivedAt, &p.CreatedAt, &p.UpdatedAt}, extra...)...); err != nil {
		return nil, err
	}
	p.ID, p.Key = entity.ProjectID(id), entity.ProjectKey(key)
	return p, nil
}

func scanProjectView(row pgx.Row) (*repository.ProjectView, error) {
	view := &repository.ProjectView{}
	var role string
	project, err := scanProject(row, &view.TasksCount, &role)
	if err != nil {
		return nil, err
	}
	view.Project = project
	view.Role = entity.ProjectRole(role)
	return view, nil
}
