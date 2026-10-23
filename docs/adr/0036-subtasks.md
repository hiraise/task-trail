# ADR-0036: A subtask is a task with a parent in the same project, one level deep

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** `tasks.parent_id` in `server/migrations/`, `entity.Task`, services in `server/internal/application/service/task/`, `taskColumns` in `server/internal/infrastructure/repository/persistent/task.go`, `Task`, `TaskEvent`, task creation and subtasks in the API contract, the task page and cards in `web/src/presentation/`

## Context

Subtasks are an "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md): a big task is
split into steps that still are tasks — with a key, status, assignee and feed.

## Decision

- A subtask is an ordinary task with `tasks.parent_id` set. It has its own key
  ([ADR-0026](0026-project-and-task-keys.md)) and shows up in every list, board and search like any
  task.
- One level: a parent has no parent itself, a task with subtasks does not become a subtask. The
  parent is in the same project and is not the task itself. A broken rule —
  `422 TASK_PARENT_INVALID`; an archived parent — `409 TASK_ARCHIVED`.
- Create a subtask with `CreateTaskRequest.parentId`. Attach a task to a parent or detach it with
  `PATCH /v1/tasks/{taskId}/parent`, body `{ "parentId": uuid | null }`: any member of the project;
  neither the task nor the project is archived ([ADR-0027](0027-reversible-archive.md)).
- `GET /v1/tasks/{taskId}/subtasks` — the task's subtasks in number order, archived ones included.
- `Task` has `parentId` (nullable), `subtasksTotal` and `subtasksDone`. The counters skip deleted and
  archived subtasks; "done" is a status with `isResolved`.
- Attaching, detaching and losing the parent write the event `parent_changed` on the subtask, with
  `fromKey` and `toKey` — the keys of the old and the new parent, `null` — none
  ([ADR-0028](0028-task-activity-feed.md)). The parent gets no event.
- Moving a subtask to another project detaches it. Moving or deleting a parent detaches its subtasks:
  they stay in their project. Each detached task gets `parent_changed` in the same transaction.
- Archiving a parent does not touch its subtasks. A parent's status does not depend on its subtasks.

## Alternatives

- Nested subtasks of any depth — a tree in every list; a small team does not need it.
- Deleting subtasks together with the parent — a mistaken click would delete several tasks.
- A checklist inside a task — not a task: no assignee, status or feed.
