# Step 13 — notification emails and due date reminders on the server

Read first: [ADR-0038](../../adr/0038-notifications.md), [ADR-0017](../../adr/0017-mail-in-admin-ui.md),
[ADR-0022](../../adr/0022-server-clock.md), [ADR-0034](../../adr/0034-task-due-date.md), the stage
[README](README.md). Step 12 must be merged: the `notifications` table with `emailed_at`, the indexes
`idx_notifications_email` and `uq_notifications_reminder`, `users.email_notifications`. No migration in
this step. Names marked *(new)* do not exist yet.

Templates: the mailer `service.Mailer` (`domain/service/mailer.go`, `Send(ctx, settings, letter)`),
`SettingsRepository.GetMail` (nil — mail is not connected) and `GetServiceURL`, letters in
`application/letter/letter.go`, links in `application/link/link.go`, the periodic loop `cleanup` in
`internal/app/app.go`, `test/smtptest` and `apitest.Server.SaveMail` for tests.

## Repositories

`NotificationRepository` gets (regenerate the mock):

```go
// EmailView — an unread notification to email and its recipient; actors are read by the service.
type EmailView struct {
    View      NotificationView
    Recipient *entity.UserAccount
}

// ListToEmail — unread, not emailed notifications created in [from, to], of users with
// email_notifications, visible to them (as in ListForUser); oldest first, at most limit.
ListToEmail(ctx context.Context, from, to time.Time, limit int) ([]*EmailView, error)
MarkEmailed(ctx context.Context, id entity.NotificationID, now time.Time) error
// CreateDueReminders writes due_soon for active, unresolved tasks with an assignee due on dueSoon
// and overdue for those due on overdue; a reminder already written is skipped. Returns how many.
CreateDueReminders(ctx context.Context, dueSoon, overdue time.Time, resolved []entity.TaskStatus, now time.Time) (int64, error)
```

- `ListToEmail` — the visibility joins of step 12 plus `JOIN users u ON u.id = n.user_id AND
  u.deleted_at IS NULL AND u.email_notifications`, `WHERE n.read_at IS NULL AND n.emailed_at IS NULL AND
  n.created_at BETWEEN @from AND @to ORDER BY n.created_at, n.seq LIMIT @limit` with `pgx.NamedArgs`.
  Read the recipient with `userColumnsOf("u")` and `scanUser(row, f, extra...)`: `scanUser` scans the user
  columns **first** and the extras after, so `userColumnsOf("u")` leads the `SELECT` list and the
  notification columns follow. The repository needs the `UserFactory` like `PGBoardRepository`
  (`NewNotificationRepo(pool, userFactory)` — update the wiring of step 12).
- `CreateDueReminders` — one statement per kind, in SQL, so that it is cheap every hour:

  ```sql
  INSERT INTO notifications (id, user_id, task_id, actor_id, kind, data, created_at)
  SELECT gen_random_uuid(), t.assignee_id, t.id, NULL, @kind, jsonb_build_object('dueDate', to_char(t.due_date, 'YYYY-MM-DD')), @now
  FROM tasks t JOIN projects p ON p.id = t.project_id
  WHERE t.due_date = @date AND t.assignee_id IS NOT NULL AND t.deleted_at IS NULL
    AND t.archived_at IS NULL AND p.archived_at IS NULL AND p.deleted_at IS NULL
    AND t.status <> ALL(@resolved::text[])
  ON CONFLICT DO NOTHING
  ```

  Pass `pgx.NamedArgs`; `@resolved` is `toStrings(resolved)` (the helper in `persistent/board.go`).

  Comment why the IDs come from `gen_random_uuid()` here and not from `IDGenerator`: a bulk insert in one
  statement; the IDs are random UUIDv4 as well. Sum `RowsAffected` of both statements.
- Repository tests: `ListToEmail` skips read, emailed, too old, a user with `email_notifications = false`;
  `CreateDueReminders` writes once (a second call returns 0), skips a done task, an archived task, a task
  without an assignee.

## Letters and links

- `link.Task(serviceURL string, id entity.TaskID) string` *(new)* — `<serviceURL>/tasks/<id>`; and
  `link.Profile(serviceURL) string` — `<serviceURL>/profile`; tests in `application/link/link_test.go`
  *(new — there is no test file yet)*.
- `letter.TaskNotification(to entity.Email, n TaskNotificationData) service.Letter` *(new)* — plain
  Russian text like the other letters; `TaskNotificationData { Kind entity.NotificationKind; TaskKey,
  TaskName, Actor string; FromStatus, ToStatus, Text, DueDate string; TaskURL, ProfileURL string }`.
  Subject: `"<KEY>: <what happened>"` passed through `oneLine`. What happened:
  - `assigned` — «<Actor> назначил(а) вас ответственным»;
  - `status_changed` — «<Actor> изменил(а) статус: <from> → <to>» (names from `entity.TaskStatuses()`);
  - `commented` — «<Actor> оставил(а) комментарий», then the text in the body;
  - `mentioned` — «<Actor> упомянул(а) вас в комментарии», then the text;
  - `due_soon` — «Срок задачи — завтра, <DD.MM.YYYY>»; `overdue` — «Срок задачи прошёл <DD.MM.YYYY>».
  Body: «Здравствуйте!», the line above, «Задача: <KEY> <name>», the link, an empty line, «Письма об
  уведомлениях отключаются в профиле: <ProfileURL>». Test each kind in `letter_test.go`.

## Application — notification module

- `Deps` gets `SettingsRepo`, `Mailer`, `EmailDelay`, `EmailMaxAge time.Duration`.
- `SendEmailsService.Execute(ctx) (int64, error)` *(new)*:
  1. `settings, err := GetMail(ctx)`; nil → `return 0, nil` (no mail — nothing to do, ADR-0017);
  2. `serviceURL` from `GetServiceURL`; empty → an error "service address is not set" (logged by the loop);
  3. `now := clock.Now()`; `ListToEmail(ctx, now.Add(-EmailMaxAge), now.Add(-EmailDelay), 50)`;
  4. read the actors of the batch with one `UserRepository.ListByIDs` (`Deps.UserRepo`, already there
     from step 12); for each: build the letter (status names from `entity.TaskStatuses()`; the actor —
     `entity.DisplayName(actor.Username, actor.Email)`, empty for reminders; the due date formatted
     `02.01.2006`), `mailer.Send` with a 10-second timeout
     (`context.WithTimeout`), on error return `sent, err` (the next run retries), on success `MarkEmailed`
     and count.
- `RemindService.Execute(ctx) (int64, error)` *(new)*: `now := clock.Now().UTC()`; before
  `reminderHourUTC` (6) → `0, nil`; today is `entity.NewDueDate(now.Date())`; `CreateDueReminders(ctx,
  today.AddDate(0, 0, 1), today.AddDate(0, 0, -1), resolved, now)` where `resolved` are the statuses with
  `IsResolved` from `entity.TaskStatuses()`.
- Service tests with gomock and `test/clock`: no mail → no list call; a send error stops the batch and
  marks only the sent ones; `RemindService` before 06:00 does nothing and at 06:00 passes tomorrow and
  yesterday.

## Wiring and jobs — `internal/app/app.go`

- Constants next to `cleanupInterval`, with one-line comments (ADR-0015 — code constants, not settings):
  `notificationEmailInterval = time.Minute`, `notificationEmailDelay = 5 * time.Minute`,
  `notificationEmailMaxAge = 24 * time.Hour`. `reminderHourUTC = 6` lives in the notification module.
- The notification module gets `SettingsRepo: settingsRepo`, `Mailer: mailer` and the constants.
- In `Run`: add `{"due date reminders created", server.Notification.Remind}` to the hourly `cleanup`
  list; start a second loop
  `go cleanup(context.Background(), logger, notificationEmailInterval, []cleaner{{"notification emails sent", server.Notification.SendEmails}})`.
  The `cleanup` function runs any `Execute(ctx) (int64, error)`; rename it and `cleaner` to `periodic`
  and `job` only if you keep the change small — optional.

## Handler tests — `v1/notification_email_test.go` *(new)*

Connect mail with the helper `withMail(s, t)` of `v1/password_test.go` (`smtptest.New` +
`s.SaveMail`). The service URL comes from `registerAdmin` (`registerBody` sends
`https://example.com/tasktrail/`, stored without the trailing slash).

- The admin assigns a task to Ivan; `s.App.Notification.SendEmails.Execute` right away sends nothing
  (younger than 5 minutes); after `s.Clock.Advance(6 * time.Minute)` — one email to Ivan with the task key
  in the subject and the link `https://example.com/tasktrail/tasks/<id>`; a second run sends nothing.
- A notification read before the run is not emailed; with `emailNotifications: false` nothing is sent;
  without mail (no `SaveMail`) `Execute` returns `0, nil`.
- Older than 24 hours → not sent.
- Reminders: a task assigned to Ivan due tomorrow; `s.App.Notification.Remind.Execute` at the `apitest`
  start time (12:00 UTC) → Ivan has `due_soon` with `dueDate`; a second run adds nothing; move the clock
  two days and run again → `overdue`; a task in `done` gets nothing.

## Docs

- Root `README.md`, «Интеграции → Почта»: a paragraph about notification emails (Russian): what is sent
  (the kinds), to whom, when (unread 5 minutes after, up to a day), which data leaves the server (the
  recipient's address, the task key and name, the actor's name, the start of a comment), how to switch it
  off (the profile switch; disabling mail stops all emails). Link ADR-0038.
- `server/README.md`: the periodic jobs — hourly cleanup and reminders, notification emails every
  minute.

## Stack

On `scripts/dev.sh up` (mail goes to Mailpit, README «Локальный стенд»): assign a task to the second user,
wait 5–6 minutes, find the email in Mailpit (`http://localhost:3025`). Smoke does not wait for it.

## Done when

Common criteria from the stage README.

## Show the customer

A notification email in Mailpit with the link to the task; the tests for the delay, the switch and
reminders; the `scripts/dev.sh check` output.
