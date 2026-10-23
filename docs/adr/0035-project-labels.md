# ADR-0035: Labels belong to a project; any member creates them, the owner and admins manage them

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** tables `labels` and `task_labels` in `server/migrations/`, `entity.Label`, module `server/internal/application/service/label/`, task moves and `taskColumns` in `server/internal/infrastructure/repository/persistent/task.go`, labels and `Task.labels` in the API contract, label pickers and task cards in `web/src/presentation/`

## Context

Labels are an "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md). Projects of
one service differ (design, backend, sales), and roles are per project
([ADR-0003](0003-fixed-roles-and-statuses.md)) — the customer chose a label set per project.

## Decision

- A label belongs to one project: `labels (id, project_id, name, color, created_at, updated_at)`.
  The name is 1–30 characters after trimming, unique in the project ignoring case
  (`uq_labels_project_name ON labels(project_id, lower(name))`); a taken name —
  `409 LABEL_NAME_TAKEN`.
- The color is one of a fixed palette `LabelColor`: `gray`, `red`, `orange`, `yellow`, `green`,
  `teal`, `blue`, `purple`. The web draws each color with design tokens `--label-<color>-bg` and
  `--label-<color>-text`; there is no free color.
- `GET /v1/projects/{projectId}/labels` — any member; `POST` — any member creates a label;
  `PATCH` and `DELETE /v1/projects/{projectId}/labels/{labelId}` — the owner and admins
  (`ProjectMember.RequireManager`), others — `403`. In an archived project every change —
  `409 PROJECT_ARCHIVED` ([ADR-0027](0027-reversible-archive.md)).
- A label is deleted at once, together with its links to tasks (`task_labels … ON DELETE CASCADE`).
- A task has 0–10 labels of its own project: `task_labels (task_id, label_id)`.
  `PUT /v1/tasks/{taskId}/labels` with `{ "labelIds": [...] }` replaces the set: any member of the
  task's project, the task is active. A label of another project or an unknown one —
  `422 LABEL_UNAVAILABLE`. The response is the `Task`.
- `Task.labels` is a required array of `Label { id, projectId, name, color }`, ordered by name;
  every task response has it, lists and boards included.
- Moving a task to another project removes its labels: labels do not cross projects.
- Label changes and label sets write no history events ([ADR-0028](0028-task-activity-feed.md)):
  the feed is about the work, not tagging.

## Alternatives

- Labels of the whole service, managed by the service administrator — the customer chose per
  project sets.
- Only the owner and admins create labels — a member would wait for an admin to tag a task.
