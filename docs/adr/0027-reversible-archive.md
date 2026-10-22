# ADR-0027: Tasks and projects can be archived and restored; archived items are read-only

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** tables `tasks` and `projects` in `server/migrations/`, `entity.Task` and `entity.Project`, services in `server/internal/application/service/task/` and `server/internal/application/service/project/`, task and project lists in `server/internal/infrastructure/repository/persistent/`, archive in the API contract, the «Архивные» tabs and task and project menus in `web/src/presentation/features/`

## Context

The tracker core ([ADR-0004](0004-lightweight-tracker-scope.md)) has statuses and an archive:
finished work is put out of sight without deleting it. In Figma the archive is one-way; the customer
chose to allow restoring, so that a wrong click does not hide a project forever.

## Decision

- A task is archived when `tasks.archived_at` is not `NULL`, a project — when `projects.archived_at`
  is not `NULL`. The API returns `archivedAt` (required, nullable) in `Task` and `Project`, and
  `Task.projectArchived` — whether the task's project is archived, read from the same join as
  `Task.key`.
- Archive and restore with `PATCH /v1/tasks/{taskId}/archived` and
  `PATCH /v1/projects/{projectId}/archived`, body `{ "archived": true | false }`. They answer `200`
  with `Task` and `ProjectDetails`. Sending the current value again changes nothing and also
  answers `200`.
- Any member of the task's project archives and restores a task; only the owner — a project.
- An archived task is read-only: any change except restoring and deleting — `409 TASK_ARCHIVED`.
  Its comments are not written, edited or deleted either.
- An archived project is read-only together with its tasks and members: changing the project,
  its members or tasks, creating a task in it and moving a task into or out of it —
  `409 PROJECT_ARCHIVED`. Allowed: restore and delete it (owner), leave it (not the owner).
- Leaving a project and removing a member clear the assignee on all tasks of the project, archived
  ones included: an assignee is always a member ([ADR-0003](0003-fixed-roles-and-statuses.md)).
- Accepting an invitation adds the member even to an archived project: the invitation was sent
  before the archive.
- Archiving a project does not touch `archived_at` of its tasks: after the project is restored,
  its tasks are active again, except those archived on their own.
- Lists, default — active, `?archived=true` — archived:
  - `GET /v1/projects` — by the project's flag;
  - `GET /v1/projects/{projectId}/tasks` — by the task's own flag; an archived project shows both
    tabs read-only;
  - `GET /v1/users/me/tasks` — active: neither the task nor its project is archived; archived:
    either is.
- `Project.tasksCount` counts tasks not archived on their own. Boards
  ([ADR-0029](0029-boards-over-projects.md)) show only tasks where neither the task nor its project
  is archived.
- Lists stay unpaginated ([ADR-0018](0018-api-conventions.md)); the web sorts them. `Project.updatedAt`
  is in the response for sorting by last update.
- Check "not archived" with entity methods (`Task.RequireActive`, `Project.RequireActive`) under the
  project lock — where roles are checked ([ADR-0003](0003-fixed-roles-and-statuses.md)).

## Verification

Handler tests: every change operation on an archived task and in an archived project answers `409`.

## Alternatives

A one-way archive, as in Figma — rejected by the customer.
