# ADR-0011: New users join by invitation

- **Status:** Superseded by [ADR-0016](0016-invite-only-signup-first-admin.md)
- **Date:** 2026-10-21
- **Affects:** `server/internal/application/service/`, `server/internal/domain/entity/`, `server/internal/presentation/http/v1/`, `server/migrations/`, `web/src/presentation/features/auth/`, `web/src/presentation/features/projects/`, access and members in the API contract

## Context

A small team does not need open registration: people are invited to a project. Open registration
also needs email verification, and mail is optional ([ADR-0012](0012-optional-mail.md)).

## Decision

- Keep registration open only while the database has no users: this is how the first account is created.
  Do the check and the creation in one transaction under `pg_advisory_xact_lock`: `DoWithTx` runs
  in READ COMMITTED, and without the lock two requests will create two "first" accounts.
- Create all other accounts only by invitation. The owner and the admin can invite to a project
  ([ADR-0003](0003-fixed-roles-and-statuses.md)) — one or several emails at once,
  including when the project is created.
- The email is already registered — add the person to the project right away with the member role.
- The email is not registered — create a row in `invitations`: project, email, inviter, expiry.
  Do not create the user before acceptance. A new invitation of the same email to the same project
  replaces the previous one; invitations to a deleted project are not valid
  ([ADR-0001](0001-soft-delete-project.md)).
- Via the invitation link the person sets a name and a password and is signed in right away.
  At that moment turn all valid invitations for their email into memberships with the member role;
  their links then lead to sign-in.
- Create every account as verified (`verified_at`). Remove `verify`, `resend-verification`
  and `UserAccount.CheckVerification` on sign-in and password reset.
- Lowercase the email and trim surrounding whitespace — before comparison and before writing.
- Make link tokens — invitation and password reset — random; store only their SHA-256 hash
  in the database. Invitation lifetime is `AUTH_INVITATION_LIFETIME_MIN`, 7 days by default.

## Consequences

- While there is no first account, anyone who reaches the server takes it: create it right after
  launch, before exposing the server to the internet. The installation guide must say so.
- There is no global administrator: any user creates projects and invites to them, and the response
  to an invitation shows whether such an email exists. For a small team this is acceptable.
- A list of unanswered invitations and their revocation — later, if needed.

## Alternatives

- The first user from environment variables or a server command — an extra step during installation.
- Registration with an empty password, like `AutoRegister` in the old API — no: it creates accounts
  nobody can sign in to.
