package persistent

import (
	"context"
	"time"

	"task-trail/internal/domain"
	"task-trail/internal/domain/entity"
	"task-trail/internal/domain/factory"
	"task-trail/internal/domain/repository"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PGNotificationRepository struct {
	PgRepository
	userFactory *factory.UserFactory
}

func NewNotificationRepo(db *pgxpool.Pool, userFactory *factory.UserFactory) *PGNotificationRepository {
	return &PGNotificationRepository{PgRepository: PgRepository{pg: db}, userFactory: userFactory}
}

// notificationData — notifications.data: only the fields the kind sets.
type notificationData struct {
	FromStatus *entity.TaskStatus `json:"fromStatus,omitempty"`
	ToStatus   *entity.TaskStatus `json:"toStatus,omitempty"`
	Text       *string            `json:"text,omitempty"`
	DueDate    *string            `json:"dueDate,omitempty"`
}

// notificationsFrom — the visibility joins: notifications of tasks that are not deleted, in projects
// where the user is still a member (ADR-0038).
const notificationsFrom = `
	FROM notifications n
	JOIN tasks t ON t.id = n.task_id AND t.deleted_at IS NULL
	JOIN projects p ON p.id = t.project_id
	JOIN project_members m ON m.project_id = t.project_id AND m.user_id = n.user_id`

// visibleNotifications — the FROM part of every read of one user's notifications. $1 is the user.
const visibleNotifications = notificationsFrom + `
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

func (r *PGNotificationRepository) ListToEmail(ctx context.Context, from, to time.Time, limit int) ([]*repository.EmailView, error) {
	rows, err := r.getDb(ctx).Query(ctx, `SELECT `+userColumnsOf("u")+`, `+notificationViewColumns+notificationsFrom+`
		JOIN users u ON u.id = n.user_id AND u.deleted_at IS NULL AND u.email_notifications
		WHERE n.read_at IS NULL AND n.emailed_at IS NULL AND n.created_at BETWEEN @from AND @to
		ORDER BY n.created_at, n.seq LIMIT @limit`,
		pgx.NamedArgs{"from": from, "to": to, "limit": limit})
	if err != nil {
		return nil, r.handleError(err)
	}
	views, err := ScanRows(rows, func(row pgx.Rows) (*repository.EmailView, error) {
		v := &repository.EmailView{}
		t := newNotificationTargets(&v.View)
		recipient, err := scanUser(row, r.userFactory, t.dest()...)
		if err != nil {
			return nil, err
		}
		v.Recipient = recipient
		t.fill()
		return v, nil
	})
	if err != nil {
		return nil, r.handleError(err)
	}
	return views, nil
}

func (r *PGNotificationRepository) MarkEmailed(ctx context.Context, id entity.NotificationID, now time.Time) error {
	tag, err := r.getDb(ctx).Exec(ctx, `UPDATE notifications SET emailed_at = $1 WHERE id = $2`, now, id)
	if err != nil {
		return r.handleError(err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrEntityNotFound(1, nil, "notificationID", id)
	}
	return nil
}

// createDueReminders writes one kind of reminder for the tasks due on @date. The IDs come from
// gen_random_uuid() and not from IDGenerator: it is a bulk insert in one statement, and the IDs
// are random UUIDv4 as well. uq_notifications_reminder skips a reminder already written.
const createDueReminders = `
	INSERT INTO notifications (id, user_id, task_id, actor_id, kind, data, created_at)
	SELECT gen_random_uuid(), t.assignee_id, t.id, NULL, @kind,
		jsonb_build_object('dueDate', to_char(t.due_date, 'YYYY-MM-DD')), @now
	FROM tasks t JOIN projects p ON p.id = t.project_id
	WHERE t.due_date = @date AND t.assignee_id IS NOT NULL AND t.deleted_at IS NULL
		AND t.archived_at IS NULL AND p.archived_at IS NULL AND p.deleted_at IS NULL
		AND t.status <> ALL(@resolved::text[])
	ON CONFLICT DO NOTHING`

func (r *PGNotificationRepository) CreateDueReminders(ctx context.Context, dueSoon, overdue time.Time, resolved []entity.TaskStatus, now time.Time) (int64, error) {
	var total int64
	for _, k := range []struct {
		kind entity.NotificationKind
		date time.Time
	}{{entity.NotifyDueSoon, dueSoon}, {entity.NotifyOverdue, overdue}} {
		tag, err := r.getDb(ctx).Exec(ctx, createDueReminders, pgx.NamedArgs{
			"kind": k.kind, "date": k.date, "resolved": toStrings(resolved), "now": now,
		})
		if err != nil {
			return total, r.handleError(err)
		}
		total += tag.RowsAffected()
	}
	return total, nil
}

// notificationTargets — Scan targets of the notificationViewColumns columns; fill builds the view.
type notificationTargets struct {
	view                     *repository.NotificationView
	id, userID, taskID, kind string
	actorID                  *string
	data                     notificationData
}

func newNotificationTargets(view *repository.NotificationView) *notificationTargets {
	view.Notification = &entity.Notification{}
	return &notificationTargets{view: view}
}

func (t *notificationTargets) dest() []any {
	n := t.view.Notification
	return []any{&t.id, &t.userID, &t.taskID, &t.actorID, &t.kind, &t.data, &n.CreatedAt, &n.ReadAt, &n.EmailedAt,
		&t.view.TaskKey, &t.view.TaskName}
}

func (t *notificationTargets) fill() {
	n, data := t.view.Notification, t.data
	n.ID, n.UserID, n.TaskID, n.Kind = entity.NotificationID(t.id), entity.UserID(t.userID), entity.TaskID(t.taskID), entity.NotificationKind(t.kind)
	if t.actorID != nil {
		actor := entity.UserID(*t.actorID)
		n.ActorID = &actor
	}
	n.FromStatus, n.ToStatus, n.Text, n.DueDate = data.FromStatus, data.ToStatus, data.Text, data.DueDate
}

// scanNotificationView reads the notificationViewColumns columns.
func scanNotificationView(row pgx.Row) (*repository.NotificationView, error) {
	view := &repository.NotificationView{}
	t := newNotificationTargets(view)
	if err := row.Scan(t.dest()...); err != nil {
		return nil, err
	}
	t.fill()
	return view, nil
}
