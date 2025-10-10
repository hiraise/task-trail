package persistent

import (
	"context"
	"task-trail/internal/usecase/dto"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgTaskRepository struct {
	PgRepostitory
}

func NewTaskRepo(db *pgxpool.Pool) *PgTaskRepository {
	return &PgTaskRepository{PgRepostitory{pg: db}}
}

func (r *PgTaskRepository) Create(ctx context.Context, data *dto.TaskCreate) (int, error) {
	var validationMap = map[string]int{
		"projectID": data.ProjectID,
		"authorID":  data.AuthorID,
	}
	if data.AssigneeID != nil {
		validationMap["assigneeID"] = *data.AssigneeID
	}
	if data.StatusID != nil {
		validationMap["statusID"] = *data.StatusID
	}
	if err := ValidateIDsMap(validationMap); err != nil {
		return 0, err
	}
	query := `
		INSERT INTO tasks (name, description, project_id, author_id, assignee_id, status_id)
		SELECT $1, $2, v.project_id, v.author_id, v.assignee_id, v.status_id
		FROM 
			( VALUES
			($3::int, $4::int, $5::int, $6::int)
			) AS v(project_id, author_id, assignee_id, status_id)
		JOIN      projects      p  ON p.id  = v.project_id  AND p.deleted_at  IS NULL
		JOIN      users         u  ON u.id  = v.author_id   AND u.deleted_at  IS NULL
		JOIN 	  task_statuses ts ON ts.id = v.status_id   AND ts.deleted_at IS NULL
		LEFT JOIN users         us ON us.id = v.assignee_id AND us.deleted_at IS NULL
		RETURNING id;`
	var id int
	err := r.getDb(ctx).QueryRow(ctx, query, data.Name, data.Description, data.ProjectID, data.AuthorID, data.AssigneeID, data.StatusID).Scan(&id)
	if err != nil {
		return 0, r.handleError(err)
	}
	return id, nil
}

func (r *PgTaskRepository) GetByID(ctx context.Context, taskID int) (*dto.TaskListRes, error) {
	if err := ValidateID(taskID, "taskID"); err != nil {
		return nil, err
	}

	query := `
		SELECT t.id, t.name, t.description, t.created_at, t.updated_at, t.author_id, t.assignee_id, t.status_id, t.project_id
		FROM tasks as t 
		WHERE t.id = $1 AND t.deleted_at IS NULL;
	`
	var item dto.TaskListRes
	if err := r.getDb(ctx).QueryRow(ctx, query, taskID).Scan(
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
		return nil, r.handleError(err)
	}
	return &item, nil
}

func (r *PgTaskRepository) UpdateByID(ctx context.Context, taskID int, data *dto.TaskUpdate) error {
	if err := ValidateID(taskID, "taskID"); err != nil {
		return err
	}
	if err := ValidateIsNotNil(data); err != nil {
		return err
	}

	kwargs := make(map[string]any)
	if data.Name != nil {
		kwargs["name"] = data.Name
	}

	if data.Description != nil {
		kwargs["description"] = data.Description
	}

	if data.AssigneeID != nil {
		kwargs["assignee_id"] = data.AssigneeID.Value
	}

	if data.ProjectID != nil {
		if err := ValidateID(*data.ProjectID, "projectID"); err != nil {
			return err
		}
		kwargs["project_id"] = data.ProjectID
	}
	if data.StatusID != nil {
		if err := ValidateID(*data.StatusID, "statusID"); err != nil {
			return err
		}
		kwargs["status_id"] = data.StatusID
	}
	if len(kwargs) == 0 {
		return nil
	}

	kwargs["updated_at"] = time.Now()
	return r.updateByID(ctx, "tasks", taskID, kwargs)
}

func (r *PgTaskRepository) Delete(ctx context.Context, taskID int) error {
	query := `
		UPDATE tasks
		SET 
			deleted_at = $1,
			updated_at = $1
		WHERE id = $2 AND deleted_at IS NULL
	`
	_, err := r.getDb(ctx).Exec(ctx, query, time.Now(), taskID)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}
