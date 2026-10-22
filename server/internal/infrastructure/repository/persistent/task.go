package persistent

import (
	"context"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGTaskRepository struct {
	PgRepository
}

func NewTaskRepo(db *pgxpool.Pool) *PGTaskRepository {
	return &PGTaskRepository{PgRepository: PgRepository{pg: db}}
}

func (r *PGTaskRepository) Create(ctx context.Context, t *entity.Task) error {
	return r.insert(ctx, "tasks", map[string]any{
		"id":          t.ID,
		"project_id":  t.ProjectID,
		"number":      t.Number,
		"name":        t.Name,
		"description": t.Description,
		"status":      t.Status,
		"author_id":   t.AuthorID,
		"assignee_id": t.AssigneeID,
		"created_at":  t.CreatedAt,
		"updated_at":  t.UpdatedAt,
	})
}

// taskColumns are read FROM taskTables: the project key comes from the task's project.
const taskColumns = `t.id, t.project_id, p.key, t.number, t.name, t.description, t.status, t.author_id, t.assignee_id, t.created_at, t.updated_at`

const taskTables = ` FROM tasks t JOIN projects p ON p.id = t.project_id`

// newestFirst is the order of task lists: newest first, ties broken by ID.
const newestFirst = ` ORDER BY t.created_at DESC, t.id`

func (r *PGTaskRepository) Get(ctx context.Context, id entity.TaskID) (*entity.Task, error) {
	query := `SELECT ` + taskColumns + taskTables + ` WHERE t.id = $1 AND t.deleted_at IS NULL`
	task, err := scanTask(r.getDb(ctx).QueryRow(ctx, query, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return task, nil
}

func (r *PGTaskRepository) ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Task, error) {
	query := `SELECT ` + taskColumns + taskTables + ` WHERE t.project_id = $1 AND t.deleted_at IS NULL` + newestFirst
	return r.list(ctx, query, projectID)
}

func (r *PGTaskRepository) ListAssigned(ctx context.Context, userID entity.UserID) ([]*entity.Task, error) {
	query := `
		SELECT ` + taskColumns + taskTables + `
		JOIN project_members m ON m.project_id = t.project_id AND m.user_id = t.assignee_id
		WHERE t.assignee_id = $1 AND t.deleted_at IS NULL` + newestFirst
	return r.list(ctx, query, userID)
}

func (r *PGTaskRepository) list(ctx context.Context, query string, args ...any) ([]*entity.Task, error) {
	rows, err := r.getDb(ctx).Query(ctx, query, args...)
	if err != nil {
		return nil, r.handleError(err)
	}
	tasks, err := ScanRows(rows, func(row pgx.Rows) (*entity.Task, error) { return scanTask(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return tasks, nil
}

func (r *PGTaskRepository) Update(ctx context.Context, t *entity.Task) error {
	tag, err := r.getDb(ctx).Exec(ctx, `
		UPDATE tasks SET project_id = $2, number = $3, name = $4, description = $5, status = $6, assignee_id = $7, updated_at = $8
		WHERE id = $1 AND deleted_at IS NULL`,
		t.ID, t.ProjectID, t.Number, t.Name, t.Description, t.Status, t.AssigneeID, t.UpdatedAt)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "taskID", t.ID)
	}
	return nil
}

func (r *PGTaskRepository) SoftDelete(ctx context.Context, id entity.TaskID, now time.Time) error {
	tag, err := r.getDb(ctx).Exec(ctx, `UPDATE tasks SET deleted_at = $2 WHERE id = $1 AND deleted_at IS NULL`, id, now)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "taskID", id)
	}
	return nil
}

func (r *PGTaskRepository) UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) error {
	_, err := r.getDb(ctx).Exec(ctx,
		`UPDATE tasks SET assignee_id = NULL, updated_at = $3 WHERE project_id = $1 AND assignee_id = $2 AND deleted_at IS NULL`,
		projectID, userID, now)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func scanTask(row pgx.Row) (*entity.Task, error) {
	var id, projectID, projectKey, status, authorID string
	var assigneeID *string
	t := &entity.Task{}
	if err := row.Scan(&id, &projectID, &projectKey, &t.Number, &t.Name, &t.Description, &status, &authorID, &assigneeID, &t.CreatedAt, &t.UpdatedAt); err != nil {
		return nil, err
	}
	t.ProjectKey = entity.ProjectKey(projectKey)
	t.ID, t.ProjectID, t.Status, t.AuthorID = entity.TaskID(id), entity.ProjectID(projectID), entity.TaskStatus(status), entity.UserID(authorID)
	if assigneeID != nil {
		assignee := entity.UserID(*assigneeID)
		t.AssigneeID = &assignee
	}
	return t, nil
}
