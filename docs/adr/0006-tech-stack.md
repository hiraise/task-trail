# ADR-0006: Stack: Go, Gin and PostgreSQL on the server; React, TypeScript and Vite on the web

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/go.mod`, `web/package.json`, imports in `web/src/`

## Context

The stack took shape in two repositories; we fix it so that new libraries do not appear
without a decision.

## Decision

- Server: Go (version in `server/go.mod`), Gin, pgx, golang-migrate, PostgreSQL.
- Web: React, TypeScript, Vite, TanStack Router, TanStack Query, Zustand,
  React Hook Form and Zod, CSS Modules.
- The web is an SPA behind authentication: server-side rendering is not needed; do not use Next.js
  (the move to Vite is PR hiraise/tt-frontend#11).
- Dependencies declared in `server/go.mod` and `web/package.json` as of this ADR's date are accepted
  together with it; the list above is only the core of the stack.
- Add a new library only together with an ADR. A version update without a behavior change
  needs no ADR.
- Declare every package imported in `web/src` in `web/package.json`: do not import transitive
  dependencies.

## Verification

`scripts/rules.mjs` — all `web/src` imports are declared in `web/package.json`.
