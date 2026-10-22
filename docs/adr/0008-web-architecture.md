# ADR-0008: The web uses layers modeled on clean architecture, one adaptive component per screen

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `web/src/`

## Context

The web client is split into layers, but almost every screen is written twice — `*Mobile` and `*Desktop`,
and `DeviceBased` picks between them by window width. Every new feature doubles the work.

## Decision

- `web/src` layers: `domain` — models and types; `application` — application services; `infrastructure` — HTTP
  and API repositories; `presentation` — components and hooks; `routes` — TanStack Router routes;
  `shared` — common utilities, constants, texts.
- Make API requests only through the repositories in `infrastructure/repositories`.
- Make a new screen or component a single one, adaptive via CSS. Do not add new components with `Mobile`
  or `Desktop` in the name or new uses of `DeviceBased`.
- When you change a screen that has a `*Mobile`/`*Desktop` pair, merge the pair into one component.
- Use the same breakpoints as `presentation/shared/hooks/useDevice.ts` (767 and 1024 px), so that old
  and new screens switch the same way. Design mockups are drawn at 393, 768 and 1200+ px.
- Take colors, shadows and fonts from the variables in `web/src/styles/globals.css`; do not set them as values.

## Verification

`scripts/rules.mjs` — components with `Mobile` or `Desktop` in the name do not exceed a threshold;
merged a pair — lower the threshold. CSS declarations with a color or shadow set as a value outside
`web/src/styles/` do not exceed a threshold either; `font-family` — only via a variable.
