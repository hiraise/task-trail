# ADR-0004: TaskTrail is a lightweight tracker: task fields and statuses are fixed, no construction kit

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** data model (`server/migrations/`), API contract, models in `web/src/domain/`

## Context

TaskTrail is a self-hosted task tracker for small teams. Large trackers are heavy above all
because of configuration: custom fields, workflow scripts, a query language. We need a tracker
that works right after installation.

## Decision

- Core (MVP, all of it is in the Figma design): projects; members with roles
  ([ADR-0003](0003-fixed-roles-and-statuses.md)); tasks with a project key like `DS-1`;
  assignee; statuses and archive; comments with the task change history; kanban boards
  with swimlanes by assignee; search across projects, boards and tasks; profile.
- Task fields are defined in the schema and the code. Add a new field only through an ADR.
- The set of statuses is fixed ([ADR-0003](0003-fixed-roles-and-statuses.md)); change it only through an ADR.
- After the core, each item gets its own ADR: priority, due date, labels, mentions and notifications,
  attachments, subtasks and links between tasks, filters, keyboard shortcuts.
- Do not build: custom fields, workflow scripts, time tracking, sprints and reports,
  a knowledge base, a custom query language.

## Alternatives

- Configurable fields and statuses, as in large trackers — they turn the tracker into a construction kit
  that must be configured before work; this is exactly what TaskTrail moves away from.
