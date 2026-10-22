# ADR-0010: Development and acceptance happen on the local machine, without a shared dev environment

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `.github/workflows/`, `scripts/dev.sh`, `scripts/stand-*.mjs`, `stand/`, server and web environment settings

## Context

The project has one developer — the agent — and the customer accepts the result. A shared dev environment
was needed while several people worked on the project.

## Decision

- Show and accept the result on the local machine. The local stack — PostgreSQL, server and web
  in Docker — is started by `scripts/dev.sh up` (`stand/compose.yaml`); its ports listen only on
  `127.0.0.1`.
- In development, send emails to a local mail catcher (Mailpit); a real SMTP server is not needed.
- Do not support building images for servers or deploy webhooks.
- A release for installation on a server (images by tag and a compose file) — a separate ADR, when needed.

## Consequences

The old shared dev environment `dev.hiraise.net/tasktrail` is no longer updated. Before stage 1, step 5
the local stack ran the reference old API from git history; now it runs the server from `server/`.
The first account and the mail of the local stack are configured by `scripts/dev.sh up` through
the service administrator API, not through the server environment
([ADR-0015](0015-settings-in-admin-ui.md), [ADR-0017](0017-mail-in-admin-ui.md)).

## Verification

`scripts/rules.mjs` — ports in `stand/compose.yaml` listen only on `127.0.0.1`.
