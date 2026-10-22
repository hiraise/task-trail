# ADR-0020: Web API types are generated from the contract with @hey-api/openapi-ts

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `web/src/infrastructure/api/generated/`, `web/openapi-ts.config.ts`, `web/package.json`, `web/src/infrastructure/repositories/`, `scripts/dev.sh`

## Context

Per [ADR-0005](0005-monorepo-api-contract.md) client types are generated from `api/openapi.yaml`.
Currently the web describes request and response bodies by hand (`application/payloads`, zod schemas
in `domain/models`), and they have drifted from the server.

## Decision

- Take API request and response types only from `web/src/infrastructure/api/generated/`. The generator
  is `@hey-api/openapi-ts`, plugin `@hey-api/typescript`: types only, no client and no code.
- Do not edit generated files by hand. Changed the contract — run `npm run api:types` in `web/`
  and commit the result together with the contract.
- Import generated types only in `web/src/infrastructure/`: repositories map them
  to `domain` models ([ADR-0008](0008-web-architecture.md)).
- Do not re-export generated types from other files: otherwise they leak outside `infrastructure`.
- Do not name contract schemas like global TypeScript types (`Error`, `Date`, `Record`): the generated
  type would shadow the global one. That is why the API error is `ApiError`.
- The generator version in `web/package.json` is exact, without `^`: another version may generate
  differently, and the check fails without any change in the contract.
- The HTTP client stays our own (`infrastructure/http`, session refresh): do not plug in the
  generator's client.

## Consequences

- Repositories and models move to the generated types at stage 1, step 6; the fate of the response
  zod schemas in `domain/models` is decided then too.
- The generator is still below version 1.0. When you bump its version, review the diff of the generated
  files.
- The generator needs Node.js 22.18 or newer; the Node.js and npm versions for the web — `engines`
  in `web/package.json`.

## Verification

`scripts/dev.sh web` generates the types into a temporary folder and compares them with the committed
ones; `scripts/rules.mjs` forbids importing them outside `infrastructure`, re-exporting them and naming
schemas like global types.

## Alternatives

- `openapi-typescript` — requires TypeScript 5 (peer `^5.x`), and the web is on TypeScript 6.
