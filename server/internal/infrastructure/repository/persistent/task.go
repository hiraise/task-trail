package persistent

import (
	"context"
	"encoding/json"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"
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
		"priority":    t.Priority,
		"due_date":    t.DueDate,
		"parent_id":   t.ParentID,
		"author_id":   t.AuthorID,
		"assignee_id": t.AssigneeID,
		"archived_at": t.ArchivedAt,
		"created_at":  t.CreatedAt,
		"updated_at":  t.UpdatedAt,
	})
}

// taskColumns are read FROM taskTables: the project key and archive flag come from the task's project.
// Labels go last as a JSON array ordered by name (ADR-0035); scanTask reads them in the same position.
const taskColumns = `t.id, t.project_id, p.key, p.archived_at IS NOT NULL, t.number, t.name, t.description, t.status, t.priority, t.due_date, ` +
	subtaskColumns + `, t.author_id, t.assignee_id, t.archived_at, t.created_at, t.updated_at, ` + taskLabelsColumn

// subtaskColumns — the parent and the counters of non-deleted, non-archived subtasks (ADR-0036).
// 'done' is entity.StatusDone — the only resolved status (ADR-0003).
const subtaskColumns = `t.parent_id,
	(SELECT count(*) FROM tasks s WHERE s.parent_id = t.id AND s.deleted_at IS NULL AND s.archived_at IS NULL),
	(SELECT count(*) FROM tasks s WHERE s.parent_id = t.id AND s.deleted_at IS NULL AND s.archived_at IS NULL
		AND s.status = 'done')`

const taskLabelsColumn = `COALESCE((SELECT json_agg(json_build_object('id', l.id, 'projectId', l.project_id, 'name', l.name, 'color', l.color)
		ORDER BY lower(l.name), l.id)
	FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id), '[]')`

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

func (r *PGTaskRepository) ListInProject(ctx context.Context, projectID entity.ProjectID, archived bool) ([]*entity.Task, error) {
	query := `SELECT ` + taskColumns + taskTables + `
		WHERE t.project_id = $1 AND t.deleted_at IS NULL AND (t.archived_at IS NOT NULL) = $2` + newestFirst
	return r.list(ctx, query, projectID, archived)
}

func (r *PGTaskRepository) ListAssigned(ctx context.Context, userID entity.UserID, archived bool) ([]*entity.Task, error) {
	query := `
		SELECT ` + taskColumns + taskTables + `
		JOIN project_members m ON m.project_id = t.project_id AND m.user_id = t.assignee_id
		WHERE t.assignee_id = $1 AND t.deleted_at IS NULL
			AND (t.archived_at IS NOT NULL OR p.archived_at IS NOT NULL) = $2` + newestFirst
	return r.list(ctx, query, userID, archived)
}

// Search: a task of a deleted project is deleted too (ProjectRepository.SoftDelete), so t.deleted_at is enough.
func (r *PGTaskRepository) Search(ctx context.Context, viewerID entity.UserID, pattern string, key *repository.TaskKeyQuery, limit int) ([]*entity.Task, error) {
	args := pgx.NamedArgs{"viewer": viewerID, "pattern": pattern, "limit": limit, "key": nil, "number": nil}
	if key != nil {
		args["key"], args["number"] = string(key.Key), key.Number
	}
	query := `
		SELECT ` + taskColumns + taskTables + `
		JOIN project_members m ON m.project_id = t.project_id AND m.user_id = @viewer
		WHERE t.deleted_at IS NULL
			AND (t.name ILIKE @pattern ESCAPE '\' OR t.description ILIKE @pattern ESCAPE '\'
				OR (p.key || '-' || t.number) ILIKE @pattern ESCAPE '\')
		ORDER BY COALESCE(p.key = @key::text AND t.number = @number::int, false) DESC, t.updated_at DESC, t.id
		LIMIT @limit`
	return r.list(ctx, query, args)
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
		UPDATE tasks SET project_id = $2, number = $3, name = $4, description = $5, status = $6, assignee_id = $7,
			archived_at = $8, updated_at = $9, priority = $10, due_date = $11, parent_id = $12
		WHERE id = $1 AND deleted_at IS NULL`,
		t.ID, t.ProjectID, t.Number, t.Name, t.Description, t.Status, t.AssigneeID, t.ArchivedAt, t.UpdatedAt, t.Priority, t.DueDate, t.ParentID)
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

func (r *PGTaskRepository) ListSubtasks(ctx context.Context, parentID entity.TaskID) ([]*entity.Task, error) {
	query := `SELECT ` + taskColumns + taskTables + ` WHERE t.parent_id = $1 AND t.deleted_at IS NULL ORDER BY t.number`
	return r.list(ctx, query, parentID)
}

func (r *PGTaskRepository) HasSubtasks(ctx context.Context, id entity.TaskID) (bool, error) {
	var has bool
	err := r.getDb(ctx).QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM tasks WHERE parent_id = $1 AND deleted_at IS NULL)`, id).Scan(&has)
	if err != nil {
		return false, r.handleError(err)
	}
	return has, nil
}

func (r *PGTaskRepository) DetachSubtasks(ctx context.Context, parentID entity.TaskID, now time.Time) ([]entity.TaskID, error) {
	rows, err := r.getDb(ctx).Query(ctx, `
		UPDATE tasks SET parent_id = NULL, updated_at = $2
		WHERE parent_id = $1 AND deleted_at IS NULL
		RETURNING id`,
		parentID, now)
	if err != nil {
		return nil, r.handleError(err)
	}
	return r.collectIDs(rows)
}

func (r *PGTaskRepository) collectIDs(rows pgx.Rows) ([]entity.TaskID, error) {
	ids, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (entity.TaskID, error) {
		var id string
		err := row.Scan(&id)
		return entity.TaskID(id), err
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return ids, nil
}

// UnassignInProject clears archived tasks too: an assignee is always a member (ADR-0027).
func (r *PGTaskRepository) UnassignInProject(ctx context.Context, projectID entity.ProjectID, userID entity.UserID, now time.Time) ([]entity.TaskID, error) {
	rows, err := r.getDb(ctx).Query(ctx, `
		UPDATE tasks SET assignee_id = NULL, updated_at = $3
		WHERE project_id = $1 AND assignee_id = $2 AND deleted_at IS NULL
		RETURNING id`,
		projectID, userID, now)
	if err != nil {
		return nil, r.handleError(err)
	}
	return r.collectIDs(rows)
}

func scanTask(row pgx.Row) (*entity.Task, error) {
	var id, projectID, projectKey, status, priority, authorID string
	var assigneeID, parentID *string
	var labelsJSON []byte
	t := &entity.Task{}
	if err := row.Scan(&id, &projectID, &projectKey, &t.ProjectArchived, &t.Number, &t.Name, &t.Description, &status, &priority, &t.DueDate,
		&parentID, &t.SubtasksTotal, &t.SubtasksDone, &authorID, &assigneeID, &t.ArchivedAt, &t.CreatedAt, &t.UpdatedAt, &labelsJSON); err != nil {
		return nil, err
	}
	labels, err := decodeTaskLabels(labelsJSON)
	if err != nil {
		return nil, err
	}
	t.Labels = labels
	t.ProjectKey = entity.ProjectKey(projectKey)
	t.Priority = entity.TaskPriority(priority)
	if t.DueDate != nil {
		// pgx reads DATE as midnight UTC; keep the location UTC for comparisons (ADR-0034).
		d := t.DueDate.UTC()
		t.DueDate = &d
	}
	t.ID, t.ProjectID, t.Status, t.AuthorID = entity.TaskID(id), entity.ProjectID(projectID), entity.TaskStatus(status), entity.UserID(authorID)
	if assigneeID != nil {
		assignee := entity.UserID(*assigneeID)
		t.AssigneeID = &assignee
	}
	if parentID != nil {
		parent := entity.TaskID(*parentID)
		t.ParentID = &parent
	}
	return t, nil
}

// decodeTaskLabels reads taskLabelsColumn; a task without labels gets an empty slice, not nil.
// CreatedAt and UpdatedAt stay zero: task responses do not carry them.
func decodeTaskLabels(raw []byte) ([]entity.Label, error) {
	var rows []struct {
		ID        string `json:"id"`
		ProjectID string `json:"projectId"`
		Name      string `json:"name"`
		Color     string `json:"color"`
	}
	if err := json.Unmarshal(raw, &rows); err != nil {
		return nil, err
	}
	labels := make([]entity.Label, len(rows))
	for i, row := range rows {
		labels[i] = entity.Label{ID: entity.LabelID(row.ID), ProjectID: entity.ProjectID(row.ProjectID),
			Name: row.Name, Color: entity.LabelColor(row.Color)}
	}
	return labels, nil
}
