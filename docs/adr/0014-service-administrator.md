# ADR-0014: A service administrator manages the service

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `users` table in `server/migrations/`, access checks in `server/internal/`, `server/internal/presentation/http/v1/`, `server/internal/presentation/http/router.go`, admin section in `web/src/presentation/features/`, administration in the API contract

## Context

Settings and integrations are configured in the UI ([ADR-0015](0015-settings-in-admin-ui.md)), and
without mail a password is recovered through a person. A role that can do this is needed; project
roles ([ADR-0003](0003-fixed-roles-and-statuses.md)) do not fit.

## Decision

- A service administrator is the `users.is_admin` flag. It does not change project roles (ADR-0003)
  and gives no access to other people's projects.
- Create the first account ([ADR-0016](0016-invite-only-signup-first-admin.md)) as an administrator.
- An administrator appoints and removes administrators. The last administrator cannot be removed:
  do the check and the removal under `pg_advisory_xact_lock`, otherwise two concurrent removals
  leave the service without administrators.
- An administrator has access to the service settings and integrations and to the user list; for
  any user they can get a password reset link.
- Check administrator permissions on the server in every administration endpoint; the web only
  hides the section.
- Always serve the API documentation (Swagger), but only to an administrator; remove the
  `SWAGGER_*` variables.

## Consequences

- Through a reset link an administrator can sign in to any account — as can anyone with access
  to the server and the database. For self-hosted this is expected.
- Blocking users and an overview of all projects — later, in a separate ADR.
