# ADR-0003: Access by three fixed roles, task statuses are fixed, identifiers are UUIDs

- **Status:** Accepted
- **Date:** 2025-10-26
- **Affects:** `server/migrations/`, access checks in `server/internal/`, roles and statuses in the API contract

## Context

A permission model with configurable roles and statuses turned out to be excessive: nobody needs
to edit them at this stage of the project.

## Decision

- Do not store permissions separately: access is determined by the role of the project member.
- There are three fixed roles: owner, admin, member. Store the role as a string
  in `project_members.role`.
- Task statuses are fixed; store the status as a string in `tasks.status`.
- Use UUIDs as entity identifiers.

## Consequences

The previous database and migrations are not carried over: migrations are merged
into `server/migrations/000001_init.*`.
