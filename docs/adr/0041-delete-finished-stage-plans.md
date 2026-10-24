# ADR-0041: The plan of a finished stage is deleted; what later work needs moves out first

- **Status:** Accepted
- **Date:** 2026-10-24
- **Affects:** `docs/plans/`, `docs/roadmap.md`, `docs/design-system.md`, `.claude/skills/step/`, `.claude/skills/plan-stage/`
- **Supersedes:** the bullet "Plans of finished steps stay as history" of [ADR-0031](0031-english-agent-docs-and-stage-plans.md)

## Context

Plans of finished stages kept thousands of lines of outdated step instructions in the repository.
Agents search the code with `git grep` (ADR-0040), and old plans show up in the results and cost
context, while every decision from them already lives in ADRs, `docs/design-system.md` and the code.

## Decision

- When the last step of a stage is done, delete `docs/plans/stage-N/` in the same PR.
- Before deleting, move what later work still needs: rules for many places — into an ADR, design
  values and mockup links — into `docs/design-system.md`, a rule of one component — into a code comment.
- A finished stage in `docs/roadmap.md` is one to three lines without a link to its plan.
- Do not link to `docs/plans/` from ADRs, READMEs, skills or code; only the roadmap links the plan
  of the current stage.
- Read an old plan only from git history when needed: `git log --oneline -- docs/plans/stage-N`.
