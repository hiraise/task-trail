# Roadmap

For agents: where the project is and where it goes, in brief. Decisions live in ADRs, working rules —
in [CLAUDE.md](../CLAUDE.md), step-by-step plans — in `docs/plans/`
([ADR-0031](adr/0031-english-agent-docs-and-stage-plans.md)). The PR that finishes a step updates
"Where we are".

## Where we are

- **Now:** stage 3 is done (2026-10-24): the
  "after the core" items of [ADR-0004](adr/0004-lightweight-tracker-scope.md) — task priority
  ([ADR-0033](adr/0033-task-priority.md)), due date with reminders
  ([ADR-0034](adr/0034-task-due-date.md)), project labels ([ADR-0035](adr/0035-project-labels.md)),
  subtasks ([ADR-0036](adr/0036-subtasks.md)), attachments
  ([ADR-0037](adr/0037-task-attachments.md)), notifications in the web and by email
  ([ADR-0038](adr/0038-notifications.md)), mentions in comments with member suggestions after «@»
  ([ADR-0039](adr/0039-comment-mentions.md)). Plans of finished stages are deleted
  ([ADR-0041](adr/0041-delete-finished-stage-plans.md)).
  Next — ask the customer which of the items below to take.
- **Server** (`server/`) implements the whole API contract `api/openapi.yaml` (conventions —
  [ADR-0018](adr/0018-api-conventions.md)): sign-in, the first account and invitations, password
  reset; users and files; projects with keys and members; fixed statuses and tasks with keys;
  the archive of tasks and projects; task comments and history; project labels; subtasks; attachments; notifications and mentions; boards; search; service
  administration.
  Tests check responses against the contract ([ADR-0019](adr/0019-server-contract-tests.md)).
- **Web** (`web/`) works on the contract (types — [ADR-0020](adr/0020-web-api-types.md), mapping
  and errors — [ADR-0024](adr/0024-web-api-mapping-and-errors.md)): sign-in and profile, projects and
  members, tasks, the archive and list sorting, the task feed, boards with the kanban, the admin
  section, search, notifications and mentions.
- **Local stack** — `scripts/dev.sh up` (README, «Локальный стенд»): the server, the web, PostgreSQL
  and Mailpit; the first `up` creates an administrator and connects mail.
- **Design** of new screens — `docs/design-system.md` and a mockup approved by the customer
  ([ADR-0025](adr/0025-design-system-in-repo.md)); screens drawn earlier — Figma (file key in CLAUDE.md).

## Stages

1. **Stage 0 — done (2026-10-21).** One repository (the history of `hiraise/tt-backend` and
   `hiraise/tt-frontend` moved into `server/` and `web/`, the old repositories archived), rules and
   ADRs, `scripts/dev.sh check` and CI, the local stack.
2. **Stage 1 — done (2026-10-22).** The API contract and a server that implements it; the web moved
   onto it; the old API reference removed. Details — ADRs 0011–0025 and git history.
3. **Stage 2 — done (2026-10-23).** The core of [ADR-0004](adr/0004-lightweight-tracker-scope.md): task
   keys, archive, comments with history, boards, search.
4. **Stage 3 — done (2026-10-24).** The "after the core" items of ADR-0004, each with its own ADR
   (0033–0039): priority, due date, labels, subtasks, attachments, notifications with emails and reminders, mentions. Mockups
   of all screens first (step 0, ADR-0025).

No stages are planned after stage 3; there is no mobile app, the web client is adaptive. Also planned:

- **Release** for self-hosting — images by tag and a compose file. A separate ADR when the customer
  wants to use TaskTrail.
- **The service administrator's power over projects** — after the plan above, with the customer's
  consent: a new ADR supersedes the bullet "gives no access to other people's projects" of
  [ADR-0014](adr/0014-service-administrator.md). Through the admin section: all projects of the
  instance, adding oneself or anyone with any role, transferring ownership, deleting a project. In the
  regular UI the administrator is a member of their own projects; access checks stay by role
  (ADR-0003). Everyone can still create projects; an "admins only" switch — when needed.

## Deferred

- A list of pending invitations («Приглашённые пользователи» in Figma) — not in the contract;
  [ADR-0016](adr/0016-invite-only-signup-first-admin.md) defers it.
- The home page «Недавно просмотренные» (a Figma draft) — left out of stage 2 by the customer.

## Keep in mind

- One local stack per machine. Check it in Chrome or Firefox: Safari rejects Secure cookies over http.
- The web has 4 old ESLint warnings — fix them when you touch those files.
