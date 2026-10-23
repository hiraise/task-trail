# ADR-0040: Agents keep long waits, merges and screenshots out of the working session

- **Status:** Proposed
- **Date:** 2026-10-23
- **Affects:** `.claude/skills/`, `CLAUDE.md` "Saving context", `ci` and `screens` in `scripts/dev.sh`, `scripts/screens.mjs`

## Context

Every request re-reads the whole session. In 25 sessions of stages 1–2, about 70% of the cost was
re-reading context, and a step session grew to 300–500k tokens. The most expensive parts needed none of
that context: waiting for CI with `sleep` (8.5% of all tokens), merging in the same session (5%),
screenshots and their images (up to 18% of a web step's context), forks started from 230–370k.

## Decision

- A procedure that needs no chat history is a skill with `context: fork` and a self-contained
  `SKILL.md`; a mechanical one runs on `model: sonnet`. Today: `/merge` and `/ui-check`.
- Wait for CI with `scripts/dev.sh ci <pr|main>` run in the background (`run_in_background`): one
  notification with one line per check and, on failure, the log before the first error. Do not poll
  with `sleep`, `gh pr checks --watch` or `gh run watch` in the foreground.
- Take screenshots of the local stack with `scripts/dev.sh screens`. Playwright is pinned in
  `PLAYWRIGHT_VERSION` of `scripts/dev.sh` and installed into `.cache/`, like golangci-lint; it is not
  a dependency of `web/`.
- Look at screenshots in `/ui-check`: the working session gets a text report, not images.
- Give a subagent a brief and a fresh context; fork the session only while it is small.

## Consequences

A forked skill does not see the chat: everything it needs comes from its `SKILL.md`, `CLAUDE.md`, the
repository and the argument. Its last message is the result the working session relays.

## Alternatives

- Playwright as a `web/` dev dependency — `npm ci` of every check and Dependabot PRs for a tool only
  agents use.
- A browser MCP server — not available in every setup, and its screenshots land in the working session.
