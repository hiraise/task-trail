# ADR-0012: Mail is optional

- **Status:** Superseded by [ADR-0017](0017-mail-in-admin-ui.md)
- **Date:** 2026-10-21
- **Affects:** `server/config/config.go`, `server/cmd/`, `server/internal/app/`, `server/internal/infrastructure/service/notification/`, `server/internal/presentation/http/v1/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, invitations and settings in the API contract

## Context

By principle 2 in [CLAUDE.md](../../CLAUDE.md), external services are optional, yet the server
does not start without SMTP settings.

## Decision

- Enable mail only if `SMTP_HOST` is set. Without it the server starts and sends no emails;
  the other `SMTP_*` are required only together with `SMTP_HOST`.
- With mail, send the invitation link ([ADR-0011](0011-invite-only-signup.md)) only by email.
  Without mail, return to the inviter in the API response a link for each invited email —
  both when adding members and when creating a project.
- Notify a person who was added to a project right away by email if mail is on; without mail, not at all.
- Without mail, endpoints that need it (`password/forgot`) respond with an error with a dedicated code,
  not with success and no email.
- Without mail, the password is reset by whoever runs the server: a server command prints a reset link
  for the given email. The command also works with mail.
- Build links from `FRONTEND_URL` and web paths; remove `FRONTEND_VERIFY_URL`,
  `FRONTEND_RESET_PASSWORD_URL` and `FRONTEND_PROJECT_URL`.
- Expose settings to the web: whether mail is enabled and whether registration is open.
  The web hides unavailable actions.

## Consequences

- Without mail, a person cannot recover their password alone — only through whoever runs the server.
- In development, mail still goes to Mailpit ([ADR-0010](0010-local-development.md)).
