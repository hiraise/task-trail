---
name: step
description: Doing a step of the current TaskTrail stage plan (docs/plans/stage-N/) — «двигаемся по плану», «следующий шаг», «шаг N», «stage 3 01». The session order from a fresh branch to the hand-off. Argument — the step number, if the customer named one.
---

# A plan step

One step — one session, one branch, one PR ([ADR-0032](../../../docs/adr/0032-one-session-plan-steps.md)).
Rules — [CLAUDE.md](../../../CLAUDE.md); how to read code without filling the context — its
"Saving context".

## 1. Start

1. The step: the number from the customer (`$ARGUMENTS`), otherwise the step marked `next` in the
   step table of the current stage README; `docs/roadmap.md` links the stage. Plans of finished
   stages are deleted (ADR-0041).
2. `git fetch`, then a worktree from the open release branch
   ([ADR-0043](../../../docs/adr/0043-release-branches.md)) — the only one in
   `git ls-remote --heads origin 'release/*'`; none or several — ask the customer (`/release` opens one):
   `git worktree add ../task-trail-<slug> -b <feat|fix|docs>/<slug> origin/release/X.Y.Z`; work there.
3. Read the stage README, the step file and the ADRs it names — before writing code. The step names
   the files to change: read those parts of them, not the folders around them.
4. The step file has a `## Progress` section — continue from it.

## 2. Work

1. The work order of a server or web step and the rules for every step — the stage README.
2. While working, run the narrow check of what you changed: `go test ./internal/<package>/...` in
   `server/` (repository tests are skipped without `TEST_PG_URL`: `scripts/dev.sh server` runs them),
   `npx vitest run <file>` in `web/`. `scripts/dev.sh check` — at the end, with the output
   to a file in the scratchpad and `tail -n 30`; on a failure, read only the failed part.
3. The context grows past ~300k and much is left — commit, write `## Progress` in the step file
   (done, left, agreed with the customer), push, and tell the customer the next session continues
   from it.

## 3. Finish

1. The step's docs in the same branch: its status `done` and `next` on the following step in the stage
   README, "Where we are" in the roadmap, what the step file asks for (`docs/design-system.md`, README). The last step of the stage
   also deletes `docs/plans/stage-N/` after moving out what later work needs (ADR-0041).
2. `scripts/dev.sh check` is green; `scripts/dev.sh up`, `scripts/dev.sh smoke`.
3. A web step — `/ui-check` with the step file and the paths of its «Stack» scenario; fix the
   deviations it reports and check again.
4. The hand-off — the `/pr` skill.
