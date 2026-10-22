# ADR-0016: New users join by invitation; the first account is the service administrator

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/internal/application/service/`, `server/internal/domain/entity/`, `server/internal/presentation/http/v1/`, `server/migrations/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, access and members in the API contract
- **Supersedes:** [ADR-0011](0011-invite-only-signup.md)

## Context

A small team does not need open sign-up: people are invited to a project. Open sign-up also needs
email confirmation, and mail is optional ([ADR-0017](0017-mail-in-admin-ui.md)).
It differs from ADR-0011 in that the first account is the service administrator, and the invitation
lifetime is not set by the environment ([ADR-0015](0015-settings-in-admin-ui.md)).

## Decision

- Open sign-up only while the database has no users: this creates the first account,
  which is also the service administrator ([ADR-0014](0014-service-administrator.md)). Do the check
  and the creation in one transaction under `pg_advisory_xact_lock`: `DoWithTx` runs in READ COMMITTED,
  and without the lock two requests create two "first" accounts.
- Create all other accounts only by invitation. The project owner and project admins
  ([ADR-0003](0003-fixed-roles-and-statuses.md)) can invite to a project — one or several
  email addresses at once, including when creating the project.
- Email already registered — add the person to the project right away with the member role.
- Email not registered — create a row in `invitations`: project, email, inviter, expiry.
  Do not create the user before acceptance. A new invitation of the same email to the same project
  replaces the previous one; invitations to a deleted project are void ([ADR-0001](0001-soft-delete-project.md)).
- Via the invitation link the person sets a name and a password and is signed in right away. At that
  moment turn all active invitations of their email into memberships with the member role; their links
  then lead to sign-in.
- Create every account as confirmed (`verified_at`). Remove `verify`, `resend-verification`
  and `UserAccount.CheckVerification` on sign-in and password reset.
- Lowercase the email and trim surrounding whitespace — before comparing and before writing.
- Make link tokens — invitation and password reset — random; store only their SHA-256 hash
  in the database. An invitation is valid for 7 days — a constant in code.

## Consequences

- Until the first account exists, anyone who reaches the server can take it: create it right after
  startup, before exposing the server to the internet. The installation guide must say so.
- Any user creates projects and invites to them, and the response to an invitation reveals whether
  such an email exists. For a small team this is acceptable.
- A list of pending invitations and revoking them — later, if needed.

## Alternatives

- The first user from environment variables or a server command — an extra step at installation.
- Sign-up with an empty password, like `AutoRegister` in the old API — no: it creates accounts
  nobody can sign in to.
