# ADR-0029: A board is a view over tasks of several projects; board membership grants no access to tasks

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** tables `boards`, `board_projects` and `board_members` in `server/migrations/`, module `server/internal/application/service/board/`, boards and task creation in the API contract, `web/src/presentation/features/boards/`

## Context

The tracker core ([ADR-0004](0004-lightweight-tracker-scope.md)) has kanban boards with swimlanes
by assignee. In Figma a board has its own members and several projects. Access to tasks stays
by project roles ([ADR-0003](0003-fixed-roles-and-statuses.md)) — the customer's decision.

## Decision

- Any signed-in user creates a board and becomes its owner. A board has a name (1–200 characters),
  projects and members; the owner is a member too. A request carries 1–50 projects and 0–50 members;
  `memberIds` is optional.
- A board member sees only those board projects, and their tasks, where they are a project member.
  A non-member of the board does not see it — `404`, checked before any role check. Board members
  see each other as `User` objects.
- The owner renames the board, changes its projects and members, deletes it. A member views the
  board, changes tasks according to their project roles and can leave the board. The owner does not
  leave, but deletes — `409 OWNER_CANNOT_LEAVE`. Other actions get `403 FORBIDDEN` for a member.
- The owner puts a project on the board only if the owner is a member of that project, otherwise —
  `422 BOARD_PROJECT_UNAVAILABLE`. Replacing the board's projects touches only the projects the
  owner sees; the others stay.
- Only a user who shares a project with the owner can be added (like the candidates of
  `GET /v1/projects/candidates`), otherwise — `422 BOARD_MEMBER_UNAVAILABLE`. There are no email
  invitations to a board: a new person is invited to a project
  ([ADR-0016](0016-invite-only-signup-first-admin.md)).
- Board tasks are active ([ADR-0027](0027-reversible-archive.md)) tasks of the board projects the
  viewer sees, whose assignee is a board member or who have no assignee. Order — by update time,
  newest first; there is no manual card order.
- Columns are statuses; swimlanes are board members and «Без ответственного». Dragging calls the
  usual `PATCH /v1/tasks/{taskId}/status` and `/assignee` ([ADR-0002](0002-task-edit-endpoints.md)).
  A board has no endpoints of its own that change tasks.
- Creating a task may set `statusId` (`CreateTaskRequest`, optional, default — the status with
  `isDefault`): a task created from a board column starts in that column.
- A board is deleted at once, without `deleted_at`. Its projects and members go with it by cascade;
  tasks stay.

## Alternatives

- Board membership grants access to all its projects' tasks and email invitations, as in Figma —
  a second access model next to project roles; the customer chose visibility by projects.
- A manual card order — a new task field; the customer decided to do without it.
