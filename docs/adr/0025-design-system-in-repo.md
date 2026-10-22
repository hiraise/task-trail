# ADR-0025: The design system is described in the repository; new screens are approved by a mockup, not in Figma

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** `docs/design-system.md`, CLAUDE.md "Where things are", `docs/roadmap.md`, `web/src/styles/`, shared components `web/src/presentation/shared/`

## Context

Screens were drawn in Figma, but on the Starter plan Figma MCP has few calls and cannot add a page:
the admin section (stage 1, step 6.4) could not be drawn there. The customer decided to stop extending
Figma.

## Decision

- The design system is `docs/design-system.md`: tokens, layout, forms, buttons, modals, icons
  with links to code. Values live in code; the document says what to use when.
- A new screen or a noticeable change of a screen: a mockup at 393, 768 and 1200 px on the Design
  canvas on claude.ai, only from the design system, with all states — and the customer's approval
  before code.
- Do not extend Figma: it is a reference for screens already drawn.
- Add a new shared component or token to the design system in the same PR.

## Consequences

- The agent needs no Figma access for new screens; old screens are still checked against it.
- The document lags behind the code unless it is edited together with the shared components.

## Alternatives

- A paid Figma plan — the customer considered Figma unnecessary for new screens.
