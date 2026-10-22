# ADR-0007: The server is built on DDD layers, the domain does not depend on the other layers

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/internal/`, `server/test/mocks/`

## Context

The server was rewritten on DDD layers (the May 2026 rework). We fix the rules so that new modules —
projects, tasks, boards — are built the same way.

## Decision

- `internal/domain` — entities, their rules, repository and service interfaces, `DomainError` errors.
- `internal/application` — application services: one service per operation, the module is assembled
  in one constructor (like `access.New`).
- `internal/infrastructure` — PostgreSQL, JWT, mail; `internal/presentation` — HTTP (Gin).
- `domain` must not import `application`, `infrastructure` or `presentation`;
  `application` must not import `infrastructure` or `presentation`. Tests (`_test.go`) may:
  they assemble an application service with real helper services, such as the ID generator.
- Put rules and invariants in entity methods, not in HTTP handlers and not in SQL.
- Run an application service that changes data inside `TxManager.DoWithTx`.
- An application service returns a `DomainError` with a code; `presentation/http/middleware/error.go`
  chooses the HTTP status by the code.
- Test application services with mocks from `test/mocks` (`make mock`), repositories with integration
  tests on PostgreSQL.

## Verification

`scripts/rules.mjs`: imports between layers, except tests.
