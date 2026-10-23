package persistent

import (
	"context"
	"errors"
	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGLabelRepository struct {
	PgRepository
}

func NewLabelRepo(db *pgxpool.Pool) *PGLabelRepository {
	return &PGLabelRepository{PgRepository: PgRepository{pg: db}}
}

// uqLabelsProjectName — the unique index of label names in a project ignoring case (migration 000012).
const uqLabelsProjectName = "uq_labels_project_name"

const labelColumns = `id, project_id, name, color, created_at, updated_at`

func (r *PGLabelRepository) Create(ctx context.Context, l *entity.Label) error {
	err := r.insert(ctx, "labels", map[string]any{
		"id":         l.ID,
		"project_id": l.ProjectID,
		"name":       l.Name,
		"color":      l.Color,
		"created_at": l.CreatedAt,
		"updated_at": l.UpdatedAt,
	})
	return nameTaken(err, l)
}

// nameTaken turns a violation of uqLabelsProjectName into LABEL_NAME_TAKEN and leaves other errors as they are.
func nameTaken(err error, l *entity.Label) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == uqLabelsProjectName {
		return domain.ErrLabelNameTaken(err, "projectID", l.ProjectID, "name", l.Name)
	}
	return err
}

func (r *PGLabelRepository) Update(ctx context.Context, l *entity.Label) error {
	tag, err := r.getDb(ctx).Exec(ctx,
		`UPDATE labels SET name = $2, color = $3, updated_at = $4 WHERE id = $1`,
		l.ID, l.Name, l.Color, l.UpdatedAt)
	if err != nil {
		return nameTaken(r.handleError(err), l)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "labelID", l.ID)
	}
	return nil
}

func (r *PGLabelRepository) Get(ctx context.Context, projectID entity.ProjectID, id entity.LabelID) (*entity.Label, error) {
	query := `SELECT ` + labelColumns + ` FROM labels WHERE project_id = $1 AND id = $2`
	l, err := scanLabel(r.getDb(ctx).QueryRow(ctx, query, projectID, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return l, nil
}

func (r *PGLabelRepository) ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Label, error) {
	query := `SELECT ` + labelColumns + ` FROM labels WHERE project_id = $1 ORDER BY lower(name), id`
	return r.list(ctx, query, projectID)
}

func (r *PGLabelRepository) ListByIDs(ctx context.Context, projectID entity.ProjectID, ids []entity.LabelID) ([]*entity.Label, error) {
	query := `SELECT ` + labelColumns + ` FROM labels WHERE project_id = $1 AND id = ANY($2::uuid[])`
	return r.list(ctx, query, projectID, toStrings(ids))
}

func (r *PGLabelRepository) list(ctx context.Context, query string, args ...any) ([]*entity.Label, error) {
	rows, err := r.getDb(ctx).Query(ctx, query, args...)
	if err != nil {
		return nil, r.handleError(err)
	}
	labels, err := ScanRows(rows, func(row pgx.Rows) (*entity.Label, error) { return scanLabel(row) })
	if err != nil {
		return nil, r.handleError(err)
	}
	return labels, nil
}

func (r *PGLabelRepository) Delete(ctx context.Context, id entity.LabelID) error {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM labels WHERE id = $1`, id)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(2, nil, "labelID", id)
	}
	return nil
}

func (r *PGLabelRepository) ReplaceForTask(ctx context.Context, taskID entity.TaskID, ids []entity.LabelID) error {
	if err := r.ClearTask(ctx, taskID); err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}
	_, err := r.getDb(ctx).Exec(ctx,
		`INSERT INTO task_labels (task_id, label_id) SELECT $1, unnest($2::uuid[])`, taskID, toStrings(ids))
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGLabelRepository) ClearTask(ctx context.Context, taskID entity.TaskID) error {
	if _, err := r.getDb(ctx).Exec(ctx, `DELETE FROM task_labels WHERE task_id = $1`, taskID); err != nil {
		return r.handleError(err)
	}
	return nil
}

func scanLabel(row pgx.Row) (*entity.Label, error) {
	var id, projectID, color string
	l := &entity.Label{}
	if err := row.Scan(&id, &projectID, &l.Name, &color, &l.CreatedAt, &l.UpdatedAt); err != nil {
		return nil, err
	}
	l.ID, l.ProjectID, l.Color = entity.LabelID(id), entity.ProjectID(projectID), entity.LabelColor(color)
	return l, nil
}
