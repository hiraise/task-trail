package persistent

import (
	"context"
	"task-trail/internal/domain/entity"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGTaskEventRepository struct {
	PgRepository
}

func NewTaskEventRepo(db *pgxpool.Pool) *PGTaskEventRepository {
	return &PGTaskEventRepository{PgRepository: PgRepository{pg: db}}
}

// taskEventData — task_events.data: only the change fields the event sets.
type taskEventData struct {
	FromStatus *entity.TaskStatus `json:"fromStatus,omitempty"`
	ToStatus   *entity.TaskStatus `json:"toStatus,omitempty"`
	FromUser   *entity.UserID     `json:"fromUser,omitempty"`
	ToUser     *entity.UserID     `json:"toUser,omitempty"`
	FromKey    *string            `json:"fromKey,omitempty"`
	ToKey      *string            `json:"toKey,omitempty"`
}

func (r *PGTaskEventRepository) Create(ctx context.Context, e *entity.TaskEvent) error {
	return r.insert(ctx, "task_events", map[string]any{
		"id":       e.ID,
		"task_id":  e.TaskID,
		"actor_id": e.ActorID,
		"kind":     e.Kind,
		"data": taskEventData{
			FromStatus: e.FromStatus, ToStatus: e.ToStatus,
			FromUser: e.FromUser, ToUser: e.ToUser,
			FromKey: e.FromKey, ToKey: e.ToKey,
		},
		"created_at": e.CreatedAt,
	})
}

func (r *PGTaskEventRepository) ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.TaskEvent, error) {
	rows, err := r.getDb(ctx).Query(ctx, `
		SELECT id, task_id, actor_id, kind, data, created_at FROM task_events
		WHERE task_id = $1 ORDER BY created_at DESC, seq DESC`, taskID)
	if err != nil {
		return nil, r.handleError(err)
	}
	events, err := ScanRows(rows, func(row pgx.Rows) (*entity.TaskEvent, error) {
		var id, taskID, actorID, kind string
		var data taskEventData
		e := &entity.TaskEvent{}
		if err := row.Scan(&id, &taskID, &actorID, &kind, &data, &e.CreatedAt); err != nil {
			return nil, err
		}
		e.ID, e.TaskID, e.ActorID, e.Kind = entity.TaskEventID(id), entity.TaskID(taskID), entity.UserID(actorID), entity.TaskEventKind(kind)
		e.FromStatus, e.ToStatus = data.FromStatus, data.ToStatus
		e.FromUser, e.ToUser = data.FromUser, data.ToUser
		e.FromKey, e.ToKey = data.FromKey, data.ToKey
		return e, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return events, nil
}
