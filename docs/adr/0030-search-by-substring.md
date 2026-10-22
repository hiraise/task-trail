# ADR-0030: Search is one request matching substrings in PostgreSQL, without indexes or extensions

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** `GET /v1/search` in the API contract, module `server/internal/application/service/search/`, search methods of `ProjectRepository`, `BoardRepository` and `TaskRepository`, `web/src/presentation/features/search/`

## Context

The tracker core ([ADR-0004](0004-lightweight-tracker-scope.md)) has search across projects, boards
and tasks. A small team has little data, and ADR-0004 rules out a query language of our own.

## Decision

- `GET /v1/search?q=…` matches a substring case-insensitively (`ILIKE … ESCAPE '\'`, with `\`, `%`
  and `_` escaped in `q`) only among what the user can see anyway: projects where they are
  a member, boards where they are a member ([ADR-0029](0029-boards-over-projects.md)) and tasks of
  their projects.
- Searched fields: project name and key; board name; task name, description and key
  (`DS-12`, [ADR-0026](0026-project-and-task-keys.md)). Comments are not searched.
- `q` is 1–100 characters after trimming, otherwise `422 VALIDATION_FAILED`.
- The response is an object `{ projects, boards, tasks }` with at most 20 results per group, in the
  same shapes as the lists: `Project`, `Board`, `Task`. Search methods live in the existing
  repositories and reuse their list queries with an extra condition.
- Order: projects and boards by name. Tasks: an exact key match first, then by update time, newest
  first. The server recognizes a key in `q` by the pattern `<project key>-<number>`, upper-cases it
  in Go and compares `projects.key` and `tasks.number` exactly.
- Archived items ([ADR-0027](0027-reversible-archive.md)) are included; `archivedAt` and
  `Task.projectArchived` mark them.
- Case-insensitive matching of Cyrillic relies on the database locale (`en_US.utf8` in the stack
  image); a test checks it.
- Do not add indexes, `pg_trgm` or full-text search until search becomes slow on real data. Then —
  a new ADR.

## Alternatives

- PostgreSQL full-text search — misses parts of words and the key `DS-1`, while substring matching
  is enough for a team of ten.
