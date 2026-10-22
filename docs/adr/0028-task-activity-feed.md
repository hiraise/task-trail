# ADR-0028: A task has one feed: comments and change history

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** tables `task_comments` and `task_events` in `server/migrations/`, services in `server/internal/application/service/task/` and `server/internal/application/service/project/`, comments and history in the API contract, the task feed in `web/src/presentation/features/tasks/`

## Context

The tracker core ([ADR-0004](0004-lightweight-tracker-scope.md)) has comments with the task change
history. In the mockup it is one feed: «Задача создана», «Open → In progress» and comments mixed.

## Decision

- A comment is plain text without markup, 1–10 000 characters after trimming spaces at the ends.
  The web makes links clickable. No mentions: they are stage 3.
- Any member of the task's project writes a comment. Only the author edits it, and only while less
  than 24 hours have passed since it was created (`entity.CommentEditWindow`); later —
  `409 COMMENT_EDIT_EXPIRED`. The author deletes it at any time, and so do the project owner and
  project admins. Others get `403 FORBIDDEN`.
- A comment addressed through another task's path is not found — `404`.
- A deleted comment is erased from the database at once. Comments and history of a deleted task
  disappear with it ([ADR-0001](0001-soft-delete-project.md)).
- History is `task_events` rows. The operation itself writes them in the same transaction, with the
  same time as the change, and only if a value changed. Rows are never edited or deleted.
- Events: `created`; `status_changed` — status from → to; `assignee_changed` — assignee from → to,
  including one removed because they left or were removed from the project; `moved` — task key
  from → to ([ADR-0026](0026-project-and-task-keys.md)); `edited` — name or description changed,
  without the old text; `archived` and `restored` ([ADR-0027](0027-reversible-archive.md)).
  A new event kind needs an ADR.
- API: `GET` and `POST /v1/tasks/{taskId}/comments`, `PATCH` and
  `DELETE /v1/tasks/{taskId}/comments/{commentId}`, `GET /v1/tasks/{taskId}/events`. Lists are newest
  first; rows with the same time keep the order they were written in (an identity column `seq`).
- The comment author, the event actor and the assignees of an event come as `User` objects in the
  response: a person may have left the project, and `GET /v1/users/{userId}` no longer shows them.
- The web shows one feed: comments and events, newest on top; with equal time a comment goes above
  an event.

## Consequences

The migration writes a `created` event for every existing task: the actor is the task author, the
time — the task's creation time.

## Verification

Handler tests: which event each task and member operation writes; the edit window — on `test/clock`.
