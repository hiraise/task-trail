# ADR-0032: A plan step fits one agent session and ships in its own PR

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** step files and the step table in `docs/plans/stage-N/`, `CLAUDE.md` "Branches and PRs", `.claude/skills/pr/`

## Context

A stage 2 step took one long session that covered the server and the web. Tool output and diffs
piled up in the context, and every later call paid for them. To save tokens, the customer clears
the context (`/clear`) between sessions.

## Decision

- Size a step for one agent session: one layer or one screen. Split a step that needs a server
  part and a web part into two steps: first the server with the contract, then the web.
- Do not split below one layer: each session pays again for reading `CLAUDE.md`, the stage
  `README.md` and the ADRs.
- One step goes in one branch and one PR. The contract, the server and the regenerated web types
  (`npm run api:types`) go in the same PR ([ADR-0005](0005-monorepo-api-contract.md)). A server
  step is shown in the local stack's Swagger.
- A session starts from the repository only: `docs/roadmap.md` → the stage `README.md` → the step
  file. It does not rely on an earlier chat.
- A step that stops halfway: commit the work to the step branch and add a `## Progress` section to
  the step file: what is done, what is left, what was agreed with the customer. The next session
  continues from it. The step's last commit removes the section.
- A step that turns out too big while it is being done: with the customer's consent, finish
  a working part as the step's PR and move the rest into a new step file.
- After the step's PR is opened, tell the customer the context can be cleared.

## Alternatives

- Sub-steps as commits in one PR per step: one showing and one CI run, but a long-lived branch
  and a big review. The customer chose one PR per step.
- One session that runs each step in a subagent with a fresh context: the customer sees less of
  the work.
