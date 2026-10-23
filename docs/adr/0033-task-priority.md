# ADR-0033: A task has one of four fixed priorities, `normal` by default

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** `tasks.priority` in `server/migrations/`, `entity.Task` and `entity.TaskPriority`, services in `server/internal/application/service/task/`, `TaskPriority`, `Task`, `TaskEvent` and task creation in the API contract, task cards and the task page in `web/src/presentation/`

## Context

Priority is the first "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md). Task
fields are fixed, so the set of priorities is fixed too, like statuses
([ADR-0003](0003-fixed-roles-and-statuses.md)).

## Decision

- Priorities, from the lowest: `low`, `normal`, `high`, `urgent`. Store the ID as a string in
  `tasks.priority VARCHAR NOT NULL DEFAULT 'normal'`; existing tasks get `normal`.
- The contract has an enum `TaskPriority` and a required field `Task.priority`. Display names and
  icons live in the web (`shared/locales/tasks.ts`): «Низкий», «Обычный», «Высокий», «Срочный».
  There is no `GET /v1/task-priorities`.
- `CreateTaskRequest.priority` is optional; without it the task gets `normal`.
- Change the priority with `PATCH /v1/tasks/{taskId}/priority`, body `{ "priority": … }`
  ([ADR-0002](0002-task-edit-endpoints.md)): any member of the task's project; neither the task nor
  its project is archived ([ADR-0027](0027-reversible-archive.md)). The same value again changes
  nothing and writes no event.
- A change writes the history event `priority_changed` ([ADR-0028](0028-task-activity-feed.md)) with
  `fromPriority` and `toPriority`. `TaskEvent` always has both fields, `null` for other kinds.
- Cards show an icon for `low`, `high` and `urgent`; `normal` shows nothing. Lists get a sort option
  «По приоритету»: `urgent` first, ties — newest updated first. The kanban order stays by update time
  ([ADR-0029](0029-boards-over-projects.md)).

## Alternatives

- Priority names from the server, like statuses — an endpoint and a cache for four constant words.
- No priority (`null`) as a fifth value — two "empty" values (`null` and `normal`) mean the same.
