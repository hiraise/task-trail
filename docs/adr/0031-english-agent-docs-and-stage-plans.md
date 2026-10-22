# ADR-0031: Agent-facing docs, code comments, commits and PRs are in English; stage plans live in `docs/plans/`

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** `CLAUDE.md`, `docs/adr/`, `docs/roadmap.md`, `docs/plans/`, `docs/design-system.md`, `.claude/skills/`, `server/README.md`, `web/README.md`, code comments and developer-facing strings in `server/`, `web/`, `scripts/`, commit messages and PRs, ADR and comment-language checks in `scripts/rules.mjs`

## Context

Agents write and read the project documentation in every task. In Russian it costs noticeably more
context than in English and mixes with English identifiers. The roadmap grew past 500 lines, while
an agent implementing a step needs only that step.

## Decision

- Write in English: `CLAUDE.md`, ADRs, `docs/roadmap.md`, `docs/plans/`, `docs/design-system.md`,
  skills in `.claude/skills/`, `server/README.md`, `web/README.md`, code comments, commit messages,
  PR titles and descriptions.
- Write developer-facing strings in English: logs, the API error `message`, output of `scripts/`.
- Keep in Russian everything people use: the root `README.md` (what TaskTrail is, how to run it,
  integrations), UI texts, emails.
- Talk to the customer in Russian: chat messages, reports, what to show before a PR. Every ADR
  that waits for the customer's decision gets a short Russian summary in the chat.
- Keep `docs/roadmap.md` an overview: where the project is, each stage in one to three lines, a link
  to the current stage plan, things to keep in mind. No step-by-step instructions in it.
- Put the detailed plan of a stage in `docs/plans/stage-N/`:
  - `README.md` — goal, step order, rules shared by all steps, status of each step;
  - one file per step, `NN-slug.md` — ADRs to read, design frames, a checklist per layer,
    done criteria, what to show the customer.
- An agent implementing a step reads `CLAUDE.md`, the stage `README.md` and its step file. Each step
  file must be enough on its own, together with the ADRs it names.
- Finished a step: mark it done in the stage `README.md` in the same PR and update
  "Where we are" in the roadmap. Plans of finished steps stay as history; decisions live in ADRs.
- ADR fields and sections are in English: `Status` (`Proposed`, `Accepted`, `Deprecated`,
  `Superseded by [ADR-NNNN](…)`), `Date`, `Affects`, `Supersedes`.

## Consequences

Code comments and developer-facing strings written before this ADR are in Russian. A separate PR
translates them before stage 2, step 1. Git history before this ADR stays in Russian.

## Verification

- `scripts/rules.mjs` checks ADR fields and statuses by their English names.
- `checkCommentLanguage()` in `scripts/rules.mjs` fails on Cyrillic in code comments (`//` and `/* */`
  in Go, TS, JS and CSS; `#` in shell, YAML, `Makefile`, `Dockerfile*` and `stand/*.template`; `--`
  in SQL) and in `summary` and `description` of `api/openapi.yaml`. String literals are not checked.

## Alternatives

Keep Russian — every task pays for it in context, and terms mix with English identifiers.
