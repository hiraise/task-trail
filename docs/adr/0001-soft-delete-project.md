# ADR-0001: A project is soft-deleted: `deleted_at` on the project and on all its entities

- **Status:** Accepted
- **Date:** 2025-09-15
- **Affects:** project and task repositories in `server/internal/infrastructure/repository/persistent/`, `server/migrations/`

## Context

Deleted projects are needed for analysis and metrics, but users must see neither them
nor anything that belongs to them.

## Decision

- On project deletion, set `deleted_at` on the project and on all related entities: tasks, and also
  roles and statuses while they were tables (since [ADR-0003](0003-fixed-roles-and-statuses.md),
  strings in rows).
- Keep users' links to a deleted project (`project_members`).
- Filter every repository query to a project or its entity by `deleted_at IS NULL`.
- When accessing a project's entity, do not check the project itself: the entity is marked
  together with it.

## Consequences

Deleted data stays in the database; queries are slightly more complex because of the `deleted_at` filter.
