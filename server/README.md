# TaskTrail — server

A Go API: Gin, pgx, PostgreSQL; the contract is [`api/openapi.yaml`](../api/openapi.yaml).
Implemented so far:

- access (`/v1/auth/*`): first account, login, session refresh, logout, password change,
  password reset by email, accepting an invitation; settings for the web client before login
  (`/v1/settings/public`);
- user (`/v1/users/me`, `/v1/users/{userId}`): name, avatar, other users
  from your projects; files (`/v1/files/{fileId}`);
- projects and members (`/v1/projects/*`): owner, admin and member roles, invitations
  by email or by link, project candidates, leaving a project and soft deletion of a project;
- tasks (`/v1/tasks/*`, `/v1/task-statuses`, `/v1/users/me/tasks`): status, assignee, moving
  to another project — each change is a separate request;
- administration (`/v1/admin/*`, service administrator only): service URL, mail
  with a connection test and a test email, users, appointing administrators, a password reset link
  for a user.

The web client works with this server through the API contract; what comes next — [docs/roadmap.md](../docs/roadmap.md).

Stack — [ADR-0006](../docs/adr/0006-tech-stack.md), code structure —
[ADR-0007](../docs/adr/0007-server-architecture.md), development process — [CLAUDE.md](../CLAUDE.md).

## Running and checks

Requires Go (version — in `go.mod`) and PostgreSQL. The server reads environment variables and
the `.env` file from the nearest parent directory and applies migrations on every start — they are
embedded in the binary (`migrations/migrations.go`).

```bash
go run ./cmd/app    # run
make mock           # regenerate mocks in test/mocks after changing interfaces
docker build -f server/docker/Dockerfile .   # image — from the repository root: needs the contract from api/
```

The first account created via the API becomes the service administrator; after it, sign-up
is closed ([ADR-0016](../docs/adr/0016-invite-only-signup-first-admin.md)). Create it right
after the start, before exposing the server to the internet: otherwise whoever reaches the server
first takes it.

Server checks — `scripts/dev.sh server` from the repository root. For integration tests
it starts a temporary PostgreSQL in Docker and passes its URL in `TEST_PG_URL`; without it
`go test` skips such tests (`test/testdb`). Repository tests and handler tests run on this
database: `test/apitest` assembles the server like `internal/app` does, with a fixed clock,
and sends requests with cookies to it, checking each response against the contract. Tests receive
emails with their own SMTP server `test/smtptest` — without Docker or network.

## Swagger

At `<API URL>/docs/` — Swagger UI with the `api/openapi.yaml` contract, for the service
administrator only ([ADR-0014](../docs/adr/0014-service-administrator.md)): log in to the web client
as an administrator and open the URL in the same browser. A web session lives 15 minutes without
a refresh: on a `401` response, reload the web page and Swagger. The contract is embedded in the
binary by the `api/` module ([ADR-0023](../docs/adr/0023-contract-embedded-from-api-module.md)), so
Swagger always shows the contract of the running version.

## Files

The server stores avatars and task attachments in the `FILES_DIR` directory
([ADR-0013](../docs/adr/0013-files-on-server-disk.md)): each file is named by its UUID from the `files`
table; the original name, type and size are only in the database. Only the API serves them
(`GET /v1/files/{fileId}`); there is no need to serve the directory through a proxy. The type is
detected by the content; everything except JPEG, PNG and WebP is served for download.

- An avatar is JPEG, PNG or WebP up to 5 MB; it is served without sign-in.
- An attachment ([ADR-0037](../docs/adr/0037-task-attachments.md)) is a file of any type up to 25 MB;
  it is served only to members of its task's project: without a session — `401`, to others — `404`.
- A proxy in front of the server must accept request bodies up to 25 MB plus 64 KB for multipart
  headers: the local stack sets `client_max_body_size` in `stand/nginx.conf.template`.

A replaced avatar or a deleted attachment stops being served immediately, and the cleanup erases it from disk — at server
start and then once an hour. The cleanup also erases files older than a day that are not in the
database: an interrupted upload leaves them. The cleanup does not touch files with other names.
A backup is the database, the `FILES_DIR` directory and `APP_SECRET` together
([ADR-0015](../docs/adr/0015-settings-in-admin-ui.md)).

## Commands

With the same binary and the same environment as the server (`app --help` — the list):

```bash
go run ./cmd/app password-reset-link ivan@example.com             # locally
docker compose exec server ./app password-reset-link ivan@example.com   # in Docker
```

`password-reset-link` prints a password reset link for any email address
([ADR-0017](../docs/adr/0017-mail-in-admin-ui.md)) — for the case when mail is not connected
and no administrator can log in. The link works once; the command prints its expiry
right after it.

## Environment variables

The environment holds only what the server cannot start without
([ADR-0015](../docs/adr/0015-settings-in-admin-ui.md)); everything else is administrator settings
in the UI or constants in `internal/app/app.go`.

| Variable | Required | Example or default | What it sets |
| --- | --- | --- | --- |
| `PG_CONNECTION_STRING` | yes | `postgresql://user:password@localhost:5432/tasktrail` | PostgreSQL connection; `@`, `+`, `%` and other special characters in the password — percent-encoded, e.g. `@` → `%40` |
| `APP_SECRET` | yes | `openssl rand -hex 32` | at least 32 characters; the keys for signing tokens and encrypting settings secrets are derived from it. Changing it ends all sessions; integration secrets will have to be entered again |
| `PORT` | no | `8080` | HTTP port |
| `APP_ROOT_PATH` | no | empty or `/api` | API path prefix behind a proxy: cookie paths are counted from it |
| `FILES_DIR` | no | `files` | files directory — for avatars; a relative path is resolved from the server's working directory, in Docker — a volume. The server creates it at start |
| `APP_DEBUG` | no | `false` | verbose logs |
