# ADR-0009: Checks live in `scripts/dev.sh`, CI runs them on every PR; `main` changes only through a PR

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `scripts/`, `.github/workflows/`, `server/.golangci.yml`, CLAUDE.md "Build and checks"

## Context

Code is written and checked by an agent, so every check must be automatic
and reproduce identically locally and in CI.

## Decision

- Make every check a `scripts/dev.sh` command; CI calls the same commands and checks nothing on its own.
- `scripts/dev.sh check` = `rules` (ADR rules, links, dependencies) + `server`
  (vet, tests with `-race`, golangci-lint) + `web` (linter, tests, types and build).
- Pin the golangci-lint version in `scripts/dev.sh`; the script downloads it into `.cache/` itself.
- Pin GitHub actions in `.github/workflows/` by commit SHA with the version in a comment.
- Run CI on every PR and on push to `main`; merge a PR only with green CI.

## Consequences

Add a new check to `scripts/dev.sh` or `scripts/rules.mjs`, not to a workflow.

## Verification

`scripts/rules.mjs` — every `uses:` in `.github/workflows/` is pinned by SHA with the version in a comment.
