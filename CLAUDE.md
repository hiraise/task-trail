# TaskTrail — working rules

TaskTrail is an open self-hosted task tracker for small teams that works without lengthy setup.
Server — Go (`server/`), web client — React and TypeScript (`web/`). The project is built by AI agents
(Claude): an agent writes and reviews the code; the project owner is the customer, who sets tasks
and accepts the results. The rules below are mandatory: they keep the project context under control.

## Principles

Only the customer can change the principles, and only with a new ADR.

1. **A lightweight tracker** ([ADR-0004](docs/adr/0004-lightweight-tracker-scope.md)). Task fields and
   statuses are fixed; there are no custom fields, workflow scripts, time tracking or query language.
2. **Self-hosted and open.** MIT license. Everything runs on your own machine. External services
   must be optional: in development, mail goes to a local catcher
   ([ADR-0010](docs/adr/0010-local-development.md)).
3. **The API contract is the source of truth** ([ADR-0005](docs/adr/0005-monorepo-api-contract.md)).
   The server and the client change together with the contract, in one PR.
4. **Settings live in the UI** ([ADR-0015](docs/adr/0015-settings-in-admin-ui.md)). The service
   administrator configures the service and integrations in the UI; environment variables hold only
   what the server cannot start without.

## Where things are

| What | Where | For whom |
| --- | --- | --- |
| Concept, how to run, repository layout | `README.md` (in Russian) | people, then agents |
| Where the project is, stages, questions to the customer | `docs/roadmap.md` | agents, then people |
| Plan of the current stage: steps with instructions | `docs/plans/stage-N/`, start with its `README.md` ([ADR-0031](docs/adr/0031-english-agent-docs-and-stage-plans.md)) | agents |
| Architecture and system decisions | `docs/adr/` (index — `docs/adr/README.md`) | agents, then people |
| API contract | `api/openapi.yaml`, conventions — [ADR-0018](docs/adr/0018-api-conventions.md) | agents |
| Server design | [ADR-0007](docs/adr/0007-server-architecture.md), environment variables — `server/README.md` | agents |
| Web client design | [ADR-0008](docs/adr/0008-web-architecture.md) | agents |
| Design | `docs/design-system.md`: tokens, layout, components; a new screen needs a mockup approved by the customer ([ADR-0025](docs/adr/0025-design-system-in-repo.md)). Screens drawn earlier — Figma, file `UXrW16oivWuiKjTmVJgXcT` (393, 768 and 1200+ px), not extended | agents |
| Working rules | `CLAUDE.md` | agents |
| Repeatable procedures: handing over a task (`/pr`), merging a PR (`/merge`) | `.claude/skills/` | agents |

- No specific task from the customer — start with `docs/roadmap.md`: it links to the current stage
  plan, and the plan names the next step.
- Implementing a step of a plan — read the stage `README.md` and the step file; they name the ADRs
  and design frames you need.
- Each fact is described in one place; elsewhere — a link, not a copy.
- Before a change, read the ADR index and the ADRs whose "Affects" overlaps with the task. Accepted
  ADRs are mandatory. Proposed ADRs wait for the customer's decision — follow them until the customer
  decides otherwise.
- Documentation is updated in the same change as the code, not "later".

## When an ADR is needed

An ADR is needed if a change:

- adds or replaces a library or a part of the stack;
- changes the data model or the API contract: new tables and fields, the meaning of existing ones,
  endpoints;
- changes access and security: authorization, roles, storage of secrets and tokens;
- changes the repository structure or an approach: layers, state handling, error handling;
- changes checks, CI or release;
- revokes an accepted decision or departs from it.

No ADR is needed for bug fixes, UI tweaks, features within accepted decisions, refactoring without
a change of approach, and version updates without behavior changes.

Write down a rule that an agent would break or reinvent without a hint; choose the place by scope:
a rule of one screen, component or function — in a comment on that code; a rule for many places,
for data, or for something not yet in the code — in an ADR.

A decision the customer did not ask for is agreed with the customer first: an ADR with the status
`Proposed`, summarized in Russian in the chat. How to write an ADR — `docs/adr/template.md`.
An accepted ADR is not rewritten in substance: to change a decision, write a new ADR with
the "Supersedes" field and set the old one's status to `Superseded by`. Without a new ADR you may fix
typos and moved paths, refine "Affects", add "Verification", and move a rule of one screen
or function into a code comment, leaving a link in the ADR.

## When to update the README

The README is written for people, in Russian. Update it if a change is visible to a user or
a developer: features, running and configuration, the local stack, checks. Each integration with
an external service (mail and the next ones) has a subsection in the README: what it does; which
data leaves the server, where and when; how to enable, configure and disable it. The "why" lives
in an ADR, and the README links to it.

## Language

[ADR-0031](docs/adr/0031-english-agent-docs-and-stage-plans.md):

- English: this file, ADRs, `docs/roadmap.md`, `docs/plans/`, `docs/design-system.md`, skills,
  `server/README.md`, `web/README.md`, code comments, logs and other developer-facing strings,
  commit messages, PR titles and descriptions. Identifiers and file names — English.
- Russian: the root `README.md` and other docs for users, UI texts, emails.
- Talk to the customer in Russian: chat messages, reports, what you show before a PR.

## Build and checks

- A task is not done until `scripts/dev.sh check` passes and CI in its PR is green
  ([ADR-0009](docs/adr/0009-checks-and-ci.md)). `check` runs the project rules
  (`scripts/dev.sh rules`), the server (vet, tests that check responses against the contract,
  golangci-lint) and the web (API types against the contract, linter, tests, types, build).
- You need Go (version — `server/go.mod`), Node.js (version — `engines` in `web/package.json`) and,
  for the local stack and integration tests, Docker. The agent starts Docker Desktop itself when
  needed.
- The local stack — `scripts/dev.sh up|smoke|down|reset|logs`; what runs there and how to sign in —
  README, «Локальный стенд». After `up`, run `smoke`.
- AI review (the `/code-review` skill) is started by the customer when they see fit; the agent does
  not start it when handing over a task.

## Branches and PRs

- Each task gets its own branch from a fresh `origin/main`: the local `main` lags behind until it is
  updated. A parallel session works in a separate worktree: `git fetch`, then
  `git worktree add ../task-trail-<task> -b <branch> origin/main`.
- When a PR is merged, remove its worktree: `scripts/dev.sh cleanup` deletes the folders and branches
  of all merged PRs — the sources stay in git history. The command leaves folders with uncommitted
  changes alone. Remove a temporary worktree (an experiment, a merge check) right after use:
  `cleanup` does not see it.
- Before opening a PR, show the result to the customer: what changed and where to see it on the local
  stack (`scripts/dev.sh up`, [ADR-0010](docs/adr/0010-local-development.md)). Show a server change
  the web does not display yet in the stack's Swagger (`/api/docs/`), with tests and the output
  of `scripts/dev.sh check`. Open the PR only after the customer says yes.
- Changes reach `main` only through a PR (`gh pr create`). The customer merges PRs; the agent merges
  only when asked and with green CI, following the `/merge` skill.
- Read CI results briefly: `gh pr checks`, on failure — `gh run view <id> --log-failed`. Repeat
  the failed step locally with the same `scripts/dev.sh` command; do not download the full log.
