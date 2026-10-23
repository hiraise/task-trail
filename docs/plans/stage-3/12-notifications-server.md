# Step 12 — notifications on the server

Read first: [ADR-0038](../../adr/0038-notifications.md), [ADR-0028](../../adr/0028-task-activity-feed.md),
[ADR-0007](../../adr/0007-server-architecture.md), the stage [README](README.md). This step writes in-app
notifications for assignment, status changes and comments, serves them, and stores the email switch.
Emails and due date reminders are [step 13](13-notification-emails-server.md), mentions —
[step 15](15-mentions-server.md), the web — [step 14](14-notifications-web.md). Names marked *(new)* do
not exist yet.

## Migration `000015_notifications`

```sql
-- up
-- Notifications of users about tasks (ADR-0038). seq only orders rows written at the same time.
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    seq BIGINT GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES users(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    actor_id UUID REFERENCES users(id),
    kind VARCHAR NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    emailed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC, seq DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;
-- The email job (step 13) looks for unread, not emailed rows.
CREATE INDEX idx_notifications_email ON notifications(created_at) WHERE emailed_at IS NULL AND read_at IS NULL;
-- A due date reminder comes at most once per user, task, kind and date (step 13).
CREATE UNIQUE INDEX uq_notifications_reminder ON notifications(user_id, task_id, kind, (data->>'dueDate'))
    WHERE kind IN ('due_soon', 'overdue');

-- Notification emails, on by default; they go only while mail is connected (ADR-0017).
ALTER TABLE users ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE;
-- down
ALTER TABLE users DROP COLUMN email_notifications;
DROP TABLE notifications;
```

## Domain

- `entity/notification.go` *(new)*:

  ```go
  type NotificationID string

  // NotificationKind — what a notification is about (ADR-0038). A new kind needs an ADR.
  type NotificationKind string

  const (
      NotifyAssigned      NotificationKind = "assigned"
      NotifyStatusChanged NotificationKind = "status_changed"
      NotifyCommented     NotificationKind = "commented"
      NotifyMentioned     NotificationKind = "mentioned"
      NotifyDueSoon       NotificationKind = "due_soon"
      NotifyOverdue       NotificationKind = "overdue"
  )

  // Notification — one user's notification about one task. Change fields are set only by the kinds
  // that use them: status_changed — FromStatus/ToStatus; commented and mentioned — Text;
  // due_soon and overdue — DueDate (YYYY-MM-DD). ActorID is nil for reminders.
  type Notification struct {
      ID         NotificationID
      UserID     UserID
      TaskID     TaskID
      ActorID    *UserID
      Kind       NotificationKind
      FromStatus *TaskStatus
      ToStatus   *TaskStatus
      Text       *string
      DueDate    *string
      CreatedAt  time.Time
      ReadAt     *time.Time
      EmailedAt  *time.Time
  }
  ```

  Methods: `(*Notification).SetRead(read bool, now time.Time)` — `true` sets `ReadAt = &now` if it is nil,
  `false` clears it.
- `TaskRecipients(task *Task, actor UserID) []UserID` *(new)* in `entity/notification.go` — the task author
  and the assignee, without duplicates and without the actor.
- `CommentExcerpt(text string) string` *(new)* — whitespace runs (including line breaks) become one
  space, trimmed; longer than 200 runes → the first 200 runes + `…`. Step 15 extends it for mentions.
- `UserAccount.EmailNotifications bool` *(new)*; `(*UserAccount).SetEmailNotifications(on bool, now)`
  *(new)* sets it and `UpdatedAt`.
- `factory/notification.go` *(new)*: `NotificationFactory{ idGenerator }`, `New(userID, taskID entity.…,
  actorID *entity.UserID, kind, now) *entity.Notification` (the time is an argument, like
  `TaskEventFactory`: the notification has the time of the change).
- Tests: `TaskRecipients` (author = assignee → one; actor excluded; no assignee), `CommentExcerpt`
  (line breaks, 200 and 201 runes in Cyrillic), `SetRead`.

## Users

`persistent/user.go`: add `email_notifications` to `userColumns` and `userColumnsOf` (after `is_admin`),
to `scanUser` and `factory.UserFactory.Restore` (a new argument after `isAdmin`), and
`email_notifications = $9` to `Update` (the ID stays `$8`). `go vet ./...` lists the callers of `Restore`.
`factory.UserFactory.New` sets `EmailNotifications: true`, and `Create` writes `"email_notifications"`:
registration and invitation acceptance return the entity built in memory, so it must already be `true`.
Test in `persistent/user_test.go`: a new user has `true`; `Update` with `false` round-trips.

## Repositories

`domain/repository/notification.go` *(new)* (add to `mock`, generate the mock):

```go
// NotificationView — a notification with the current key and name of its task.
type NotificationView struct {
    Notification *entity.Notification
    TaskKey      string
    TaskName     string
}

// NotificationRepository — notifications (ADR-0038). Lists, counts and Get see only notifications of
// tasks that are not deleted, in projects where the user is still a member.
type NotificationRepository interface {
    Create(ctx context.Context, notifications ...*entity.Notification) error
    // ListForUser — the newest limit notifications, newest first.
    ListForUser(ctx context.Context, userID entity.UserID, limit int) ([]*NotificationView, error)
    CountUnread(ctx context.Context, userID entity.UserID) (int, error)
    // Get — the user's notification; another user's is ENTITY_NOT_FOUND.
    Get(ctx context.Context, userID entity.UserID, id entity.NotificationID) (*NotificationView, error)
    SetReadAt(ctx context.Context, id entity.NotificationID, readAt *time.Time) error
    MarkAllRead(ctx context.Context, userID entity.UserID, now time.Time) error
    // DeleteOlderThan erases notifications created before the moment; returns how many.
    DeleteOlderThan(ctx context.Context, before time.Time) (int64, error)
}
```

`persistent/notification.go` *(new)*:

- `data` JSONB — `notificationData { FromStatus, ToStatus *entity.TaskStatus; Text, DueDate *string }` with
  `omitempty` tags (copy `taskEventData`).
- The visibility part of every read:

  ```sql
  FROM notifications n
  JOIN tasks t ON t.id = n.task_id AND t.deleted_at IS NULL
  JOIN projects p ON p.id = t.project_id
  JOIN project_members m ON m.project_id = t.project_id AND m.user_id = n.user_id
  WHERE n.user_id = $1
  ```

  The task key is `p.key || '-' || t.number`. Order `n.created_at DESC, n.seq DESC`.
- Repository tests: visibility (a deleted task and a left project hide the row from list and count),
  order, `MarkAllRead`, `DeleteOlderThan`.

## Application

**Module `application/service/notification/` *(new)*** — `Deps { Clock; NotificationRepo; UserRepo;
Retention time.Duration }`,
`NotificationModule { List, UnreadCount, SetRead, ReadAll, Cleanup }`:

- `const listLimit = 100`.
- `dto.Notification { View *repository.NotificationView; Actor *entity.UserAccount }` *(new)* in
  `application/dto/notification.go`; actors through `UserRepository.ListByIDs` in one query (copy
  `feed.people` in `service/task/activity.go`; a nil actor stays nil).
- `ListService.Execute(ctx, userID)`, `UnreadCountService.Execute(ctx, userID) (int, error)`,
  `SetReadService.Execute(ctx, userID, id string, read bool) (*dto.Notification, error)` (`Get`, then
  `SetRead`, `SetReadAt`, returns the view with the actor), `ReadAllService.Execute(ctx, userID) error`.
- `CleanupService.Execute(ctx) (int64, error)` — `DeleteOlderThan(clock.Now().Add(-retention))`, the
  retention comes from `Deps.Retention time.Duration`.

**Writing notifications in the task module** (`service/task/`):

- `Deps` and `editor` get `NotificationRepo` and `NotificationFactory`; add
  `func (e *editor) notify(ctx context.Context, notifications ...*entity.Notification) error` — it skips
  an empty list and calls `Create` (in the current transaction).
- Where:
  - `CreateTaskService` — a task created with an assignee other than the author → `assigned` to the
    assignee, time `task.CreatedAt`;
  - `ChangeAssigneeService` apply — a new assignee other than the actor → `assigned`;
  - `ChangeStatusService` apply — the status changed → `status_changed` with `FromStatus`/`ToStatus` to
    `entity.TaskRecipients(task, actor)`;
  - `CreateCommentService` — `commented` with `Text = CommentExcerpt(comment.Text)` to
    `TaskRecipients(task, author)`; time — `comment.CreatedAt`. Step 15 removes mentioned users from
    this list.
  - Moves, archive, priority, due date, labels, subtasks — no notifications (ADR-0038).
- Add `NotificationRepo` to `deps` in `newModule` (`service/task/task_test.go`) and update gomock
  expectations: tests of these four services expect `NotificationRepo.Create` (or none when there are no
  recipients).

**User module** (`service/user/`): `SetEmailNotificationsService.Execute(ctx, userID string, on bool)
(*entity.UserAccount, error)` *(new)* — `GetForUpdate` in a transaction, `SetEmailNotifications`,
`Update` (copy `RenameService`).

**Wiring** `internal/app/app.go` — it already imports `internal/infrastructure/service/notification`
(the SMTP mailer), so import the new module with an alias:
`notifications "task-trail/internal/application/service/notification"`.
`notificationRepo := persistent.NewNotificationRepo(pool)`,
`notificationFactory := factory.NewNotificationFactory(idGen)`; the task module gets both; the
notification module with `Retention: notificationRetention`; `const notificationRetention = 90 * 24 *
time.Hour` next to `cleanupInterval` (a code constant, ADR-0015); `Server.Notification`; add
`{"old notifications deleted", server.Notification.Cleanup}` to the hourly `cleanup` call in `Run`;
`Notification` in `v1.Modules`.

## Contract

- Tag `notifications` — "notifications about tasks (ADR-0038)".
- Schemas: `NotificationKind` — enum of the six kinds with a description of who gets each;
  `NotificationTask { id, key, name }`; `Notification { id, kind, task: NotificationTask, actor: User |
  null, createdAt, readAt (date-time | null), fromStatusId, toStatusId (TaskStatusId | null), text
  (string | null — "the start of the comment: 200 characters, then `…` if it was longer"; no `maxLength`),
  dueDate (date | null) }` — all
  required; `UnreadNotifications { count: integer ≥ 0 }`; `SetNotificationReadRequest { read: boolean }`
  (required); `EmailNotificationsRequest { enabled: boolean }` (required).
- `CurrentUser.emailNotifications` — boolean, required, "notification emails; they go only while mail is
  connected (ADR-0038)".
- Paths:
  - `GET /v1/notifications` `listNotifications` — `200 Notification[]` ("the newest 100"), 401, 500;
  - `GET /v1/notifications/unread-count` `countUnreadNotifications` — `200 UnreadNotifications`, 401, 500;
  - `PATCH /v1/notifications/{notificationId}` `setNotificationRead` — `200 Notification`, 401, 404, 422,
    500; parameter `NotificationId`;
  - `POST /v1/notifications/read-all` `readAllNotifications` — `204`, 401, 500;
  - `PATCH /v1/users/me/email-notifications` `setEmailNotifications` (tag `users`) — `200 CurrentUser`,
    401, 422, 500.

## HTTP

- `request/notification.go` *(new)*: `setReadReq { Read *bool \`json:"read" binding:"required"\` }` (a
  pointer, like `setArchivedReq`), `emailNotificationsReq { Enabled *bool \`json:"enabled" binding:"required"\` }`,
  `BindSetRead`, `BindEmailNotifications`.
- `response/notification.go` *(new)*: `Notification` with nested `NotificationTask` and `*User` actor,
  `NewNotification(dto.Notification)`, `NewNotifications`, `UnreadNotifications { Count int }`.
  `response.CurrentUser.EmailNotifications bool \`json:"emailNotifications"\``.
- `v1/notification.go` *(new)*: routes under `authMW` — `GET /notifications`,
  `GET /notifications/unread-count`, `PATCH /notifications/:notificationId`, `POST /notifications/read-all`.
  Register `/notifications/unread-count` and `/notifications/read-all` explicitly; gin matches static
  segments before `:notificationId`.
- `v1/user.go`: `PATCH /me/email-notifications`.

## Handler tests — `v1/notification_test.go` *(new)*

Two users in one project (`registerAdmin`, `createProject`, `signUp`; switch with `session`/`login`).

- The admin creates a task assigned to Ivan → Ivan has one `assigned` with `actor` = admin, the admin has
  none; assigning yourself writes nothing.
- Ivan changes the status of the admin's task → the admin gets `status_changed open→in_progress`; Ivan
  gets nothing.
- The admin comments a task where Ivan is the assignee → Ivan gets `commented` with the text; a
  1000-character comment gives 200 runes + `…`.
- `unread-count` follows; `PATCH {read: true}` → `readAt` set and the count drops; `{read: false}` → back;
  another user's notification → `404`; `read-all` → `204`, count `0`.
- Ivan leaves the project → his notifications of its tasks are gone from the list and the count; a deleted
  task hides them too.
- Order: newest first (`s.Clock.Advance` between actions).
- `s.App.Notification.Cleanup.Execute` after `s.Clock.Advance(91 * 24 * time.Hour)` deletes them. The
  jump expires both session tokens: `login` again before the next API call.
- `PATCH /v1/users/me/email-notifications {enabled: false}` → `emailNotifications: false` in the response
  and in `GET /v1/users/me`; `{}` → `422`.

## Web types

`npm run api:types`; `emailNotifications: false` in `CurrentUser` fixtures if the build asks.

## Stack

Smoke: the admin assigns the smoke task to the member at creation — already done; as the member,
`GET /v1/notifications/unread-count` ≥ 1, the list has `assigned`; `read-all` → count `0`.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: notifications of the member after the admin's actions, the unread count, read and read-all,
the email switch in `users/me`; the tests and the `scripts/dev.sh check` output.
