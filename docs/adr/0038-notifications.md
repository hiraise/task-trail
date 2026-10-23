# ADR-0038: Notifications live in the service and repeat by email in the background; due dates remind the assignee

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** tables `notifications` and `users.email_notifications` in `server/migrations/`, `entity.Notification`, module `server/internal/application/service/notification/`, task and comment services in `server/internal/application/service/task/`, periodic jobs in `server/internal/app/app.go`, `server/internal/application/letter/`, notifications and `CurrentUser` in the API contract, the bell and `web/src/presentation/features/notifications/`, the profile page

## Context

Notifications are an "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md). The
customer chose: a bell in the web, emails when mail is connected
([ADR-0017](0017-mail-in-admin-ui.md)), and due date reminders ([ADR-0034](0034-task-due-date.md)).

## Decision

- A notification is a `notifications` row for one user about one task: `kind`, `actor_id` (nullable),
  `data JSONB`, `created_at`, `read_at`, `emailed_at`. There are no subscriptions or watchers.
- Kinds and recipients, never the actor:
  - `assigned` — the new assignee, also when a task is created with an assignee;
  - `status_changed` — the task author and the assignee, with `fromStatusId` and `toStatusId`;
  - `commented` — the task author and the assignee, with the start of the comment (`text`, up to
    200 characters); a user mentioned in that comment gets `mentioned` instead
    ([ADR-0039](0039-comment-mentions.md));
  - `due_soon` — the assignee, the day before the due date; `overdue` — the assignee, the day after
    it, if the status is not `isResolved`. Both carry `dueDate`, at most once per task, kind and date.
- The operation writes its notifications in its own transaction, like history
  ([ADR-0028](0028-task-activity-feed.md)). Reminders come from an hourly job, from 06:00 UTC
  (`reminderHourUTC`), for active tasks of active projects.
- A user sees only notifications of tasks that are not deleted, in projects where they are still a
  member. `GET /v1/notifications` — the newest 100, newest first; `GET /v1/notifications/unread-count`;
  `PATCH /v1/notifications/{notificationId}` with `{ "read": bool }` — `200`; another user's — `404`;
  `POST /v1/notifications/read-all` — `204`. The hourly cleanup deletes notifications older than
  90 days.
- `users.email_notifications BOOLEAN NOT NULL DEFAULT TRUE`, `CurrentUser.emailNotifications`;
  the user switches it with `PATCH /v1/users/me/email-notifications`, body `{ "enabled": bool }`.
- A job every minute emails each notification that is still unread 5 minutes after it was created,
  younger than 24 hours, not emailed yet, to a user with `email_notifications` — only while mail is
  connected. One email per notification, with a link to `<service address>/tasks/{taskId}`. A sent
  one gets `emailed_at`; a send error stops the batch and the next run retries.
- Notification emails are not sent within the request and their errors do not reach the API — unlike
  emails with links ([ADR-0017](0017-mail-in-admin-ui.md)); the job logs them.
- The web polls `unread-count` every 60 seconds while the tab is visible; there is no push channel.

## Alternatives

- Subscriptions to tasks and projects — settings per task; the author and the assignee cover a small
  team.
- WebSocket or SSE — a long-lived connection through the proxy for one counter.
- An email right within the request — a comment would wait for SMTP, and a person working in the web
  would get emails they have already seen.
