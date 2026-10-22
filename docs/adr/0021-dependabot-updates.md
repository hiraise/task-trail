# ADR-0021: Dependabot proposes updates of dependencies and GitHub Actions

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `.github/dependabot.yml`, `server/go.mod`, `web/package.json`, `.github/workflows/`

## Context

Dependencies are bumped by hand whenever someone gets around to it. GitHub Actions are pinned by SHA
([ADR-0009](0009-checks-and-ci.md)) and without a prompt will never be updated — not even for
vulnerability fixes.

## Decision

- Dependabot proposes updates per `.github/dependabot.yml`: Go modules of `server/` and npm packages
  of `web/` — weekly, GitHub Actions — monthly.
- Minor and patch updates of one ecosystem come in one PR (groups `server`, `web`, `actions`).
  Major ones come in separate PRs: they may require code changes.
- `@hey-api/openapi-ts` — always in a separate PR: a new generator version changes the types, and
  the agent regenerates them in that PR's branch ([ADR-0020](0020-web-api-types.md)).
- A Dependabot PR goes through the same CI. The customer merges it when CI is green; if CI fails, the
  agent fixes it in that PR's branch at the customer's request.
- An update without a behavior change needs no ADR ([ADR-0006](0006-tech-stack.md)). Dependabot does
  not add new libraries, so it does not bypass the ADR on the stack.

## Consequences

- Dependabot does not see the golangci-lint version in `scripts/dev.sh` and the local stack images
  in `stand/compose.yaml` — they are bumped by hand.
- Dependabot commits and PRs are in English. Replaced by [ADR-0031](0031-english-agent-docs-and-stage-plans.md):
  all commits and PRs are in English.

## Alternatives

- Renovate — more flexible, but it is a separate GitHub app; the built-in Dependabot is enough for
  three ecosystems.
