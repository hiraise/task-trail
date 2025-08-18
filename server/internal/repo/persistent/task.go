package persistent

import (
	"context"
	"task-trail/internal/usecase/dto"

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
