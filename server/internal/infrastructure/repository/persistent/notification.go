package persistent

import (
	"context"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/repository"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGNotificationRepository struct {
	PgRepository
}

func NewNotificationRepo(db *pgxpool.Pool) *PGNotificationRepository {
	return &PGNotificationRepository{PgRepository: PgRepository{pg: db}}
}

// notificationData — notifications.data: only the fields the kind sets.
type notificationData struct {
	FromStatus *entity.TaskStatus `json:"fromStatus,omitempty"`
	ToStatus   *entity.TaskStatus `json:"toStatus,omitempty"`
	Text       *string            `json:"text,omitempty"`
	DueDate    *string            `json:"dueDate,omitempty"`
}

// visibleNotifications — the FROM part of every read: a user sees notifications of tasks that are
// not deleted, in projects where they are still a member (ADR-0038). $1 is the user.
const visibleNotifications = `
	FROM notifications n
	JOIN tasks t ON t.id = n.task_id AND t.deleted_at IS NULL
	JOIN projects p ON p.id = t.project_id
	JOIN project_members m ON m.project_id = t.project_id AND m.user_id = n.user_id
	WHERE n.user_id = $1`

const notificationViewColumns = `n.id, n.user_id, n.task_id, n.actor_id, n.kind, n.data, n.created_at, n.read_at,
	n.emailed_at, p.key || '-' || t.number, t.name`

func (r *PGNotificationRepository) Create(ctx context.Context, notifications ...*entity.Notification) error {
	for _, n := range notifications {
		err := r.insert(ctx, "notifications", map[string]any{
			"id":       n.ID,
			"user_id":  n.UserID,
			"task_id":  n.TaskID,
			"actor_id": n.ActorID,
			"kind":     n.Kind,
			"data": notificationData{
				FromStatus: n.FromStatus, ToStatus: n.ToStatus, Text: n.Text, DueDate: n.DueDate,
			},
			"created_at": n.CreatedAt,
			"read_at":    n.ReadAt,
			"emailed_at": n.EmailedAt,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *PGNotificationRepository) ListForUser(ctx context.Context, userID entity.UserID, limit int) ([]*repository.NotificationView, error) {
	rows, err := r.getDb(ctx).Query(ctx, `SELECT `+notificationViewColumns+visibleNotifications+`
		ORDER BY n.created_at DESC, n.seq DESC LIMIT $2`, userID, limit)
	if err != nil {
		return nil, r.handleError(err)
	}
	views, err := ScanRows(rows, func(row pgx.Rows) (*repository.NotificationView, error) {
		return scanNotificationView(row)
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return views, nil
}

func (r *PGNotificationRepository) CountUnread(ctx context.Context, userID entity.UserID) (int, error) {
	var count int
	err := r.getDb(ctx).QueryRow(ctx, `SELECT count(*)`+visibleNotifications+` AND n.read_at IS NULL`, userID).Scan(&count)
	if err != nil {
		return 0, r.handleError(err)
	}
	return count, nil
}

func (r *PGNotificationRepository) Get(ctx context.Context, userID entity.UserID, id entity.NotificationID) (*repository.NotificationView, error) {
	view, err := scanNotificationView(r.getDb(ctx).QueryRow(ctx,
		`SELECT `+notificationViewColumns+visibleNotifications+` AND n.id = $2`, userID, id))
	if err != nil {
		return nil, r.handleError(err)
	}
	return view, nil
}

func (r *PGNotificationRepository) SetReadAt(ctx context.Context, id entity.NotificationID, readAt *time.Time) error {
	tag, err := r.getDb(ctx).Exec(ctx, `UPDATE notifications SET read_at = $1 WHERE id = $2`, readAt, id)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(1, nil, "notificationID", id)
	}
	return nil
}

func (r *PGNotificationRepository) MarkAllRead(ctx context.Context, userID entity.UserID, now time.Time) error {
	_, err := r.getDb(ctx).Exec(ctx, `UPDATE notifications SET read_at = $1 WHERE user_id = $2 AND read_at IS NULL`, now, userID)
	if err != nil {
		return r.handleError(err)
	}
	return nil
}

func (r *PGNotificationRepository) DeleteOlderThan(ctx context.Context, before time.Time) (int64, error) {
	tag, err := r.getDb(ctx).Exec(ctx, `DELETE FROM notifications WHERE created_at < $1`, before)
	if err != nil {
		return 0, r.handleError(err)
	}
	return tag.RowsAffected(), nil
}

// scanNotificationView reads the notificationViewColumns columns.
func scanNotificationView(row pgx.Row) (*repository.NotificationView, error) {
	var id, userID, taskID, kind string
	var actorID *string
	var data notificationData
	n := &entity.Notification{}
	view := &repository.NotificationView{Notification: n}
	if err := row.Scan(&id, &userID, &taskID, &actorID, &kind, &data, &n.CreatedAt, &n.ReadAt, &n.EmailedAt,
		&view.TaskKey, &view.TaskName); err != nil {
		return nil, err
	}
	n.ID, n.UserID, n.TaskID, n.Kind = entity.NotificationID(id), entity.UserID(userID), entity.TaskID(taskID), entity.NotificationKind(kind)
	if actorID != nil {
		actor := entity.UserID(*actorID)
		n.ActorID = &actor
	}
	n.FromStatus, n.ToStatus, n.Text, n.DueDate = data.FromStatus, data.ToStatus, data.Text, data.DueDate
	return view, nil
}
