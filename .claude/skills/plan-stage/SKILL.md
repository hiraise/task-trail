---
name: plan-stage
description: Planning the next TaskTrail stage — clarifying questions, ADRs, a plan in docs/plans/stage-N/ of one-session steps that agents at a medium effort level can follow. Use when the customer asks to prepare the plan of a stage.
---

# Planning a stage

The plan format — [ADR-0031](../../../docs/adr/0031-english-agent-docs-and-stage-plans.md), step
size — [ADR-0032](../../../docs/adr/0032-one-session-plan-steps.md). The model to copy — the previous
stage's plan in `docs/plans/`. Read it for its form, not its content.

## 1. Scope and decisions

1. The stage in `docs/roadmap.md` and the scope in [ADR-0004](../../../docs/adr/0004-lightweight-tracker-scope.md).
2. Ask the customer the clarifying questions at once, in one message, with your recommendation
   for each.
3. Each decision about data, the API, access or the stack — an ADR with the status `Proposed`
   (`docs/adr/template.md`), summarized in Russian. The plan is written after the customer accepts them.

## 2. Research without filling the context

1. Map the code with `Explore` subagents started in parallel, one per area (a server module, a web
   feature, the stack and checks). Give each a brief: what the stage changes there, which answer is
   needed (files, types, functions, patterns to copy) — a summary, not file contents.
2. No forks for research: a fork copies the whole session.

## 3. The plan

1. `docs/plans/stage-N/README.md`: the goal, the ADR table, the step table with statuses (the first
   step `next`), the work order of a server and a web step, rules for every step, recipes for changes
   that touch many places, common mistakes, design, a code map.
2. One file per step, `NN-slug.md`: «Read first», then by layer — exact files, types, functions, SQL,
   tests and texts; names that do not exist yet marked *(new)*; «Stack», «Done when», «Show the customer».
   The step must be enough on its own: an agent at a medium effort level does it without exploring.
3. A stage with new screens starts with step 0 — mockups of all of them, approved by the customer
   ([ADR-0025](../../../docs/adr/0025-design-system-in-repo.md)).
4. A server part and a web part are separate steps (ADR-0032).
5. The last step's «Done when» includes deleting `docs/plans/stage-N/`, after moving design values
   and mockup links into `docs/design-system.md` and shared rules into ADRs
   ([ADR-0041](../../../docs/adr/0041-delete-finished-stage-plans.md)).

## 4. Check and hand over

1. Check every step file against the code with `Explore` subagents (one per few steps): every named
   file, function and signature exists or is marked *(new)*. Fix what they report.
2. `docs/roadmap.md` links the plan; the `/pr` skill.
