# ADR 0002: Simplify access model

Date: 2025-10-26  
Status: Active

## Context

The current permissions model is redundant. Dynamic role editing is useless in the current stage of the project. Also as task statuses. Considered:

- Simplify project design
- Keep current design.

## Solution

- Remove permissions, granting access based on user role.
- Make three constant roles (Owner, Admin, Member) and store they as VARCHAR in db (table `project_mambers`).
- Make task statuses constant and store ther as VARCHAR in `tasks` table.
- Change id type to UUID.

## Consequences

\+ Project will become easier.
\- The existing database and all migrations will be lost.
