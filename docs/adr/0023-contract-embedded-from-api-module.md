# ADR-0023: The server embeds the contract from the `api/` Go module, not from a copy

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `api/go.mod`, `api/openapi.go`, `server/go.mod`, `server/docker/`, Swagger in `server/internal/presentation/http/docs.go`

## Context

Swagger shows the administrator the contract `api/openapi.yaml` ([ADR-0005](0005-monorepo-api-contract.md),
[ADR-0014](0014-service-administrator.md)), and the server must carry it in the binary. But `go:embed`
does not take files outside the Go module, and the contract is not in `server/`.

## Decision

- `api/` is the Go module `task-trail/api`: `api/openapi.go` embeds `openapi.yaml` into `api.OpenAPI`.
- `server/go.mod` includes it via `replace task-trail/api => ../api`; the module has no versions or tags.
- Do not add a copy of the contract to `server/`: the `openapi.yaml` file exists only in `api/`.
- Build the server image from the repository root: `docker build -f server/docker/Dockerfile .`;
  what goes into the build context is set by `server/docker/Dockerfile.dockerignore`.

## Consequences

- Changed the contract — the server's Swagger changes with it, no separate step.
- The local stack (stage 1, step 5) builds the server with the repository root as the build context.

## Verification

`scripts/rules.mjs`: the `openapi.yaml` file exists only in `api/`.

## Alternatives

- A copy in `server/` compared in tests — a second file in every contract change and a sync step.
- Reading the file from disk — a path in the environment, and ADR-0015 allows no new variables.
