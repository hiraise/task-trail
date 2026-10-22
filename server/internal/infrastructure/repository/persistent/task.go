package persistent

import (
	"context"
	"task-trail/internal/domain/entity"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PGTaskRepository struct {
	PgRepository
}

func NewTaskRepo(db *pgxpool.Pool) *PGTaskRepository {
	return &PGTaskRepository{PgRepository: PgRepository{pg: db}}
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
