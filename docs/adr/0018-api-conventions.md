# ADR-0018: API contract conventions: UUIDs, an error with a code, a change returns the resource

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `api/openapi.yaml`, HTTP layer `server/internal/presentation/`, `server/internal/presentation/http/middleware/error.go`, API client `web/src/infrastructure/`

## Context

The contract `api/openapi.yaml` ([ADR-0005](0005-monorepo-api-contract.md)) is being written anew, and
the old API baseline in it is not a model to follow: numeric IDs, an error without a code, only `id`
after a change. Without common rules every new endpoint would solve this its own way.

## Decision

- Paths — `/v1/...`, plural resources, `kebab-case`; JSON fields — `camelCase`.
- IDs are UUID strings; time is ISO 8601 strings in UTC. An empty value is `null`: the field is always
  present in the response.
- Request data goes in the JSON body; the path holds only the resource ID. Tokens from links (invitation,
  password reset) — only in the body, so they do not end up in proxy logs.
- Creation responds with `201` and the created resource, a change — `200` and the changed resource,
  deletion and an action without a result — `204` without a body.
- An error is `{ code, message, details }`. `code` is a value from `ErrorCode` in the contract; the
  client chooses its reaction by it; `message` is for logs, not for display; `details` — the fields with
  validation errors, or `null`.
- Error statuses: `401` — not signed in, `403` — insufficient role, `404` — no resource or the user
  is not a member of its project (we do not reveal existence), `409` — conflict with the state, `422` —
  data validation, `502` — an external service did not respond, e.g. mail.
- Project access is by role `owner`, `admin` or `member` ([ADR-0003](0003-fixed-roles-and-statuses.md)):
  the API returns the role, not a set of permissions. The contract names the required role for each endpoint.
- A list is returned as an array without a wrapper and without pagination, until pagination is needed.

## Consequences

- At stage 1 the web moves to these rules: string IDs, `role` instead of `permissions`, the full task
  in the response to a status or assignee change, `avatarId` instead of `avatarUrl`, task statuses —
  a common list `GET /v1/task-statuses`.
