# ADR-0026: A project has a key, a task has a number in its project; the task key is `DS-12`

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** tables `projects` and `tasks` in `server/migrations/`, `entity.Project` and `entity.Task`, task creation and moves in `server/internal/application/service/task/`, projects and tasks in the API contract, the project form and task cards in `web/src/presentation/features/`

## Context

The tracker core ([ADR-0004](0004-lightweight-tracker-scope.md)) has tasks with a project key like
`DS-1`: people name a task by its key and find it with search. The mockups have both Latin and
Cyrillic keys (`CM-84`, `РМП-8309`).

## Decision

- A project key `key` is 2–10 characters: letters of any alphabet and digits 0–9, starting with
  a letter (`^\p{L}[\p{L}0-9]{1,9}$`). The server trims and upper-cases it (`strings.ToUpper`) in the
  request's `normalize()`, before validation; stores and returns it upper-case.
- The key is unique among non-deleted projects (a partial unique index); a taken key —
  `409 PROJECT_KEY_TAKEN`. The key of a deleted project ([ADR-0001](0001-soft-delete-project.md))
  is free again.
- The key is required when a project is created. Only the owner changes it
  (`PATCH /v1/projects/{projectId}`, field `key`); other roles get `403 FORBIDDEN`.
- A task number `number` is sequential within the project, starting at 1. The counter
  `projects.task_counter` hands it out with one `UPDATE … RETURNING` under the project lock
  (`ProjectRepository.GetForUpdate`). Numbers are never reused: a deleted task keeps its number.
- Moving a task to another project gives it the next number of that project; the old key no longer
  finds it. Moving a task to its own project changes nothing: no new number, no history event.
- The task key is `<project key>-<number>`. The API returns it ready-made in `Task.key` next to
  `Task.number`. Changing a project key changes the keys of all its tasks; numbers stay.
- The key is for display and search ([ADR-0030](0030-search-by-substring.md)). In API and web paths
  a task is still addressed by its UUID ([ADR-0018](0018-api-conventions.md)).

## Consequences

The migration gives existing projects keys `P1`, `P2`… by creation date and numbers the tasks of
each project by creation date, deleted ones included. The owner can change the key later.

## Verification

Handler tests of projects and tasks: key format and uniqueness, numbering, moves.

## Alternatives

- Latin-only keys — the mockups have Cyrillic keys; the customer chose any letters.
- The task key in page addresses — the key changes with the project key and on a move, the UUID
  does not.
