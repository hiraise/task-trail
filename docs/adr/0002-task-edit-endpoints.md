# ADR-0002: A task is changed through a separate endpoint per operation

- **Status:** Accepted
- **Date:** 2025-09-15
- **Affects:** task endpoints in `server/internal/presentation/http/v1/`, API contract

## Context

A task needs to be edited, moved through statuses, reassigned and moved between projects.

## Decision

- Give each task operation its own endpoint: edit the text, change the status,
  change the assignee, move to another project.

## Consequences

There are more endpoints, but each is responsible for one action, and logs are easier to read.

## Alternatives

- One endpoint for all task changes — rejected: it is responsible for everything at once,
  and logs do not show what exactly changed.
