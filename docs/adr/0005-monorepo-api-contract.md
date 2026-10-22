# ADR-0005: One repository: server, web client and API contract `api/openapi.yaml`

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `api/`, the HTTP layer `server/internal/presentation/`, the API client `web/src/infrastructure/`

## Context

The server and the web client lived in separate repositories, and the contract between them diverged:
the client calls `/v1/auth/*`, while the server, after the rework, responds on `/v1/access/*`.

## Decision

- Keep the server in `server/`, the web client in `web/`, the API contract in `api/openapi.yaml` (OpenAPI 3).
- Make an API change in one PR: contract, server and client together.
- The contract is the source of truth: generate client types from it, check server responses
  against it with tests.
- The Swagger generated from server annotations (`server/docs/swagger.*`, `make swag`)
  stops being the API description as soon as `api/openapi.yaml` appears. It is removed entirely:
  Swagger shows the contract itself ([ADR-0023](0023-contract-embedded-from-api-module.md)).
- The history of `hiraise/tt-backend` and `hiraise/tt-frontend` is moved into `server/` and `web/`;
  the old repositories are archived.

## Verification

Contract checks in `scripts/dev.sh check`: server responses — [ADR-0019](0019-server-contract-tests.md), web types — [ADR-0020](0020-web-api-types.md).

## Alternatives

- Two repositories with a shared contract — there is one developer, and contract versions
  would have to be synchronized between the repositories by hand.
