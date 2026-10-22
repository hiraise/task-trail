# ADR-0017: The administrator connects mail in the service UI

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/internal/infrastructure/service/notification/`, `server/internal/app/`, `server/cmd/`, `server/internal/presentation/http/v1/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, admin section in `web/src/presentation/features/`, `scripts/dev.sh`, mail, invitations and settings in the API contract
- **Supersedes:** [ADR-0012](0012-optional-mail.md)

## Context

External services are opt-in (principle 2 in [CLAUDE.md](../../CLAUDE.md)), and settings are
in the UI ([ADR-0015](0015-settings-in-admin-ui.md)). It differs from ADR-0012 in that SMTP
is set by the administrator, not by the environment.

## Decision

- Mail is enabled once the administrator ([ADR-0014](0014-service-administrator.md)) has saved
  the SMTP settings: server, port, encryption (none, STARTTLS, TLS), sender and, if needed,
  login and password. Without them the server works and sends no emails.
- Check the connection before saving; the administrator can send themselves a test email.
- With mail, send the invitation link ([ADR-0016](0016-invite-only-signup-first-admin.md))
  only by email. Without mail, return to the inviter in the API response a link for each invited
  email — both when adding members and when creating a project.
- Send emails with links — invitation, password reset — right within the request: if one is not sent,
  return the sending error in the API response (for invitations — per email), not only in the log.
- A person added to a project directly: with mail, notify them by email; without mail, not at all.
- Without mail, endpoints that need it (`password/forgot`) respond with an error with its own code,
  not with success without an email.
- Without mail, the administrator issues the password reset link. For whoever runs the server,
  a server command prints a reset link for any email — for the case when no administrator
  can sign in.
- Build links from the service URL (ADR-0015); there are no `FRONTEND_*` variables.
- Serve to the web without sign-in: whether mail is enabled and whether sign-up is open. The web
  hides unavailable actions.

## Consequences

- In development mail goes to Mailpit ([ADR-0010](0010-local-development.md)) without encryption
  and without login: `scripts/dev.sh up` saves its settings through the admin API; certificates
  and `SSL_CERT_FILE` are not needed on the local stack.
