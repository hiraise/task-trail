---
name: ui-check
description: Checking TaskTrail web screens on the local stack against the approved mockups and the step file, in its own context so screenshots do not stay in the working session (ADR-0040). Use in a web step after `scripts/dev.sh up`, before showing the customer. Argument — the step file and what to check (screens, states, paths with real ids).
context: fork
agent: general-purpose
model: sonnet
background: false
---

# Checking screens

You run in a separate context without the chat ([ADR-0040](../../../docs/adr/0040-agent-context-economy.md)).
The request: `$ARGUMENTS`. Do not change code: you check and report; the working session fixes.

## 1. What the screens must show

1. The step file named in the request: «Stack», «Show the customer», the screens it changes, the
   artboards it names.
2. The current stage's mockups file (`docs/plans/stage-N/00-mockups.md`): what the named artboards
   hold and «Approved values» — tokens, icons, agreed deviations. Open the canvas linked in the stage
   README only if the text does not describe how an artboard looks.
3. Tokens and components — `docs/design-system.md`.

## 2. Screenshots

1. The stack answers: `curl -sf -o /dev/null http://localhost:3000` — otherwise `scripts/dev.sh up`.
2. Data the scenario needs and the request does not give (a task with a priority, a label): create it
   through the API with a small Node script in the scratchpad that imports `createSession` and `ADMIN`
   from `scripts/stand-api.mjs`, the way `scripts/stand-smoke.mjs` does.
3. `scripts/dev.sh screens <scratchpad>/screens <path>... [--click <selector>]...` — PNGs at 393, 768
   and 1200 px, one line per file and its problems (console errors, a failed click). A modal or a
   picker — `--click` with a text or role selector, for example `--click 'text=Приоритет'`.
4. Look at each image. Compare with section 1: layout per width, texts, icons, colors and tokens,
   states (empty, archived, error), nothing cut off or overlapping, the bottom bar does not cover content.

## 3. Report

Your last message goes to the working session; write it in English, short:

- per screen and width: `OK` or each deviation in one line — what differs from what, and the likely
  file (component or CSS module) if it is clear;
- console errors and failed clicks;
- the folder with the PNGs, so the working session can show a file to the customer without taking
  new screenshots.
