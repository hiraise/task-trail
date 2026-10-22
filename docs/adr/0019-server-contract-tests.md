# ADR-0019: Server responses are checked against the contract in tests with kin-openapi

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/test/contract/`, handler tests in `server/internal/presentation/http/v1/`, `server/go.mod`, `server/docker/Dockerfile`, `api/openapi.yaml`

## Context

Per [ADR-0005](0005-monorepo-api-contract.md) tests check server responses against `api/openapi.yaml`.
This needs a library that understands OpenAPI 3.1 and JSON Schema 2020-12.

## Decision

- Check responses with `server/test/contract`: `contract.Load(t)` reads and validates the contract,
  `Check(t, req, rec)` matches the recorded response against the contract operation: the status is in
  the contract, required headers are present, the body matches the schema and has no fields the schema
  lacks.
- Every handler test in `server/internal/presentation/http/v1/` passes all its responses through `Check`,
  both successes and errors.
- The library is `github.com/getkin/kin-openapi`, only in `_test.go` and `server/test/`; `server/test/`
  is also imported only by tests. This keeps the library out of the server binary.
- The helper itself checks the formats `uuid`, `email`, `uri` and `date-time` (UTC only): in JSON Schema
  2020-12 formats are only annotations, and without this a numeric ID would pass the check.
- Every contract operation lists its statuses explicitly, `500` included. Do not use `default`:
  with it any status counts as described.
- A contract that kin-openapi cannot parse (broken reference, wrong structure) fails
  the server tests.

## Consequences

- kin-openapi needs Go 1.25+, so the server moves to Go 1.27 (`go.mod`, `server/docker/Dockerfile`):
  Go 1.24 no longer gets fixes.
- OpenAPI 3.1 support in kin-openapi is still changing. When you bump its version, run
  `go test ./test/contract/`: it checks that the validator still catches invalid responses.

## Verification

`scripts/rules.mjs`: kin-openapi and `server/test/` are not imported outside tests, handler tests
in `v1/` call `contract.Load`; `go test ./test/contract/` checks the helper itself.

## Alternatives

- `pb33f/libopenapi-validator` — requires Go 1.26 and is less widespread.
- Redocly CLI in `check` — one more tool: the server tests and the web type generator already parse
  the contract ([ADR-0020](0020-web-api-types.md)). It is stricter about schemas, so when changing the
  contract, run it manually: `npx --yes @redocly/cli@1 lint api/openapi.yaml`.
