# ADR-0034: A task has an optional due date — a calendar day without time

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** `tasks.due_date` in `server/migrations/`, `entity.Task`, services in `server/internal/application/service/task/`, `Task`, `TaskEvent` and task creation in the API contract, task cards, the task page and list sorting in `web/src/`

## Context

Due date is an "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md). A team agrees
on a day, not a moment; a moment in time would show a different day in another time zone.

## Decision

- Store the due date as `tasks.due_date DATE NULL`; `NULL` — no due date. The contract field
  `Task.dueDate` is `string`, `format: date` (`2026-10-30`), required and nullable
  ([ADR-0018](0018-api-conventions.md)).
- The server keeps the date as `time.Time` at 00:00 UTC (`entity.NewDueDate`) and writes it as
  `YYYY-MM-DD` (`time.DateOnly`) in responses and in history.
- Any valid date is accepted, also a past one: a task may be planned late.
- `CreateTaskRequest.dueDate` is optional. Change it with `PATCH /v1/tasks/{taskId}/due-date`,
  body `{ "dueDate": "YYYY-MM-DD" | null }`, the field is required, `null` removes the date: any member
  of the task's project; neither the task nor its project is archived
  ([ADR-0027](0027-reversible-archive.md)).
- A change writes the event `due_date_changed` ([ADR-0028](0028-task-activity-feed.md)) with
  `fromDueDate` and `toDueDate` (`null` — no date). The same value again writes nothing.
- The web decides "overdue" itself: the due date is before today's local date and the task's status
  is not `isResolved`. Overdue dates are drawn in `--text-critical`. The web picks dates with the
  native `<input type="date">` — no date picker library.
- Lists get a sort option «По сроку»: the earliest date first, tasks without a date last.
- Reminders about due dates are notifications ([ADR-0038](0038-notifications.md)).

## Alternatives

- A due moment (`timestamptz`) — the day shifts across time zones; a time of day is not needed.
- A date picker library — one more dependency; the native input works on phones and desktops.
