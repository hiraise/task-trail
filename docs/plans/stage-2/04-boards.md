# Step 4 — boards: list, creation, board info

Read first: [ADR-0029](../../adr/0029-boards-over-projects.md), the stage [README](README.md).
Steps 1–3 must be merged. The kanban itself is step 5.

## Migration `000009_boards`

- Table `boards`: `id UUID PRIMARY KEY`, `name VARCHAR(200) NOT NULL`,
  `owner_id UUID NOT NULL REFERENCES users(id)`, `created_at`, `updated_at` (`TIMESTAMPTZ NOT NULL`).
- Table `board_projects`: `board_id UUID REFERENCES boards(id) ON DELETE CASCADE`,
  `project_id UUID REFERENCES projects(id)`, primary key `(board_id, project_id)`.
- Table `board_members`: `board_id UUID REFERENCES boards(id) ON DELETE CASCADE`,
  `user_id UUID REFERENCES users(id)`, `created_at TIMESTAMPTZ NOT NULL`, primary key
  `(board_id, user_id)`; index on `user_id`.

## Domain

- `entity.Board` *(new)*: `ID`, `Name`, `OwnerID`, `CreatedAt`, `UpdatedAt`; methods
  `Rename(name, now)`, `RequireOwner(userID)` (`FORBIDDEN`), `CheckLeave(userID)`
  (`OWNER_CANNOT_LEAVE`).
- `BoardFactory.New(name, ownerID)` *(new)*.
- Error codes `BOARD_PROJECT_UNAVAILABLE` and `BOARD_MEMBER_UNAVAILABLE` → `422` — six places each.
  Russian texts: «Проект недоступен: на доску можно добавить только свой проект»,
  «Пользователь недоступен: добавить можно только того, с кем у вас есть общий проект».
- Make the web text of `OWNER_CANNOT_LEAVE` fit both cases: «Владелец не может уйти — проект или
  доску можно только удалить».

## Repository `BoardRepository` *(new)*

- `Create` — the board, the owner in `board_members`, the projects.
- `GetForUpdate(id)`; `IsMember(boardID, userID)`.
- `GetView(id, viewerID)` — a non-member gets `ENTITY_NOT_FOUND`. Returns `BoardView`:
  - `Board`;
  - `Projects` — `id`, `name`, `key`, `archivedAt`; only non-deleted projects where the viewer is
    a member, by name;
  - `Members` — users, the owner first, the others by the time they were added;
  - `TasksCount` — the same condition as `ListTasks`.
- `ListViews(viewerID)` — newest first.
- `Update` — name and `updated_at`.
- `ReplaceProjects(boardID, ownerID, projectIDs)` — deletes the board's projects where the owner is
  a member, inserts the new ones.
- `AddMembers(boardID, userIDs, now)` — `ON CONFLICT DO NOTHING`.
- `RemoveMember`, `Delete`.
- `ListTasks(boardID, viewerID)` — tasks by the ADR-0029 rule: projects of the board, viewer is
  a member of the project, the task and its project are not archived, not deleted, assignee is
  a board member or `NULL`. Order `t.updated_at DESC, t.id`. Keys and `projectArchived` — like in
  `TaskRepository` (reuse its column list and scan function).

## Module `application/service/board/` *(new)*

- Services `List`, `Get`, `Create`, `Rename`, `SetProjects`, `AddMembers`, `RemoveMember`, `Leave`,
  `Delete`, `ListTasks`.
- Every change runs in a transaction in this order: `BoardRepository.GetForUpdate` → `IsMember`
  (no → `404`) → `board.RequireOwner` or `board.CheckLeave` (`403` / `409`). A non-member never
  gets `403` (ADR-0029).
- Project check: `ProjectMemberRepository.Get(projectID, ownerID)`; not a member →
  `BOARD_PROJECT_UNAVAILABLE`.
- User check: the user must be in `UserRepository.ListCandidates(ownerID, nil)`, otherwise
  `BOARD_MEMBER_UNAVAILABLE`; skip the owner if listed.
- The owner cannot remove themselves — `OWNER_CANNOT_LEAVE`.
- Wire the module in `internal/app/app.go`, `v1.Modules` and `v1/router.go`; handlers in
  `v1/board.go` *(new)*.

## Contract

- A top-level tag `boards`.
- Schemas:
  - `Board { id, name, ownerId, createdAt, updatedAt, projects: BoardProject[], members: User[], tasksCount }`;
  - `BoardProject { id, name, key, archivedAt }` — `archivedAt` required, nullable;
  - `CreateBoardRequest { name, projectIds (1–50), memberIds (0–50, optional) }`;
  - `UpdateBoardRequest { name }`;
  - `SetBoardProjectsRequest { projectIds (1–50) }`;
  - `AddBoardMembersRequest { userIds (1–50) }`.
- Operations:
  - `listBoards`, `createBoard` — `GET`, `POST /v1/boards`;
  - `getBoard`, `updateBoard`, `deleteBoard` — `GET`, `PATCH`, `DELETE /v1/boards/{boardId}`;
  - `setBoardProjects` — `PUT /v1/boards/{boardId}/projects`;
  - `addBoardMembers` — `POST /v1/boards/{boardId}/members`;
  - `removeBoardMember` — `DELETE /v1/boards/{boardId}/members/{userId}`;
  - `leaveBoard` — `DELETE /v1/boards/{boardId}/leave`;
  - `listBoardTasks` — `GET /v1/boards/{boardId}/tasks` (`Task[]`).
- Changes answer `200` with `Board`; deletion and leaving — `204`; creation — `201`.

## Tests

- Permissions: owner, board member, outsider (`404` everywhere for the outsider).
- Project and user checks, including a project the owner has left.
- Visibility: a viewer who is not in project B sees only project A and its tasks; `tasksCount`
  matches.
- Task filter: assignee not on the board — the task is absent; no assignee — present; archived
  task or archived project — absent.
- `ReplaceProjects` keeps projects the owner does not see.
- Deleting a board leaves the tasks; leaving the board.

## Web — data

- `Board` model, mapper with a test; `domain/repositories/BoardRepository.ts` *(new)* and
  `infrastructure/repositories/apiBoardRepository.ts` *(new)*; addresses in `API_ROUTES`.
- Cache keys `board.all`, `board.detail(id)`, `board.tasks(id)` *(new)*; hooks in
  `features/boards/hooks/`.
- `invalidateTaskLists` (`taskCache.ts`) also refetches the `["board"]` prefix; so do a project key
  change, archiving or restoring a project, leaving a project and removing a member.
- Delete `application/dto/MockBoardDto.ts` and every use of it.

## Web — routes

Restructure like `routes/_main/projects/$id/`:

- `routes/_main/boards/index.tsx` — «Мои доски»;
- `routes/_main/boards/$id/index.tsx` — the board (replaces `boards/$id.tsx`): in this step the list
  «Задачи на доске», in step 5 — the kanban;
- `routes/_main/boards/$id/info.tsx` — board info;
- `routes/_main/boards/$id/members.tsx` — board members on a phone.

## Web — screens

- **«Мои доски»** — merge `BoardsDesktopPage` + `BoardsMobilePage` into `BoardsPage`:
  - a grid of `BoardListItem`: name up to three lines, task count, member avatars;
  - empty state, sorting `useListSort("boards")`, the «Создать доску» button;
  - frames `805:87630`, `911:60137`, `1504:174848`, `1772:144664`, `1907:188972`, `1772:143382`.
- **New board** — `CreateBoardForm` *(new)* in a modal. Frames: phone `919:65152`, `1334:39210`
  (errors), `919:66260`, `1334:38775`; desktop `1775:154351`, `1775:154839`, `1775:154484`.
  - Name — 1–200 characters, with a counter.
  - Projects — multiple choice of your active projects; selected on top; the whole card is clickable.
  - Members — from `GET /v1/projects/candidates`, the same list as «Добавить участников» of a project,
    without email input. The note under the list: «Добавить можно тех, с кем у вас есть общий
    проект. Нового человека пригласите в проект — потом его можно добавить на доску».
  - After creation — go to the board.
- **Board page** `/boards/$id` in this step: the header (name, «…» menu) and the list
  «Задачи на доске». Replace `BoardMobilePage` with `BoardPage` — the kanban goes there in step 5.
- **Board info** `/boards/$id/info`, by the pattern of the project page (`ProjectInfo`, `MemberGroups`,
  project tasks). Frames: phone `843:91329`, `1340:27745`; tablet `1522:178121`; desktop
  `1772:145700`, `1775:150747`.
  - Header: name, «owner | creation date», the «…» menu.
  - «Проекты на доске» — chips with horizontal scroll. For the owner the arrow opens the project
    picker: a modal with search and checkboxes, «Сохранить изменения» (frames `1775:149125`,
    `1340:66557`, `1522:183763`). Projects the viewer does not see never appear.
  - «Участники на доске»:
    - on a phone — avatars and a link to `/boards/$id/members` (frames `843:92288`, `919:61858`);
    - wider — the list expands in place: groups «Владелец доски» and «Участники доски»;
    - no «Приглашённые пользователи» group: boards have no email invitations;
    - the owner removes a member (trash icon, confirmation «Вы действительно хотите удалить
      участника {имя}?») and adds new ones from the candidates.
  - «Задачи на доске» — key, name and assignee avatar, sorting `useListSort("board-tasks")`, the
    floating «Создать задачу» button. In this step it opens the usual new task form with the project
    choice limited to the board's projects; step 5 adds the status from a column. Frames:
    `1021:81575`, `1775:151903`.
- **Board actions.**
  - Menu: the owner gets «Переименовать доску» and «Удалить доску», a member — «Покинуть доску»
    (frame `843:91329`).
  - Rename — a modal with the field and a 0/200 counter (`843:91482`, `1772:147292`).
  - Confirmations: «Вы действительно хотите покинуть доску «{название}»? Отменить это действие будет
    невозможно.» (`874:93509`) and the same for deletion (`843:93028`). Afterwards — go to `/boards`.

## Mobile/Desktop pairs to merge

`BoardsDesktopPage` + `BoardsMobilePage`; `BoardMobilePage` becomes `BoardPage`. Then lower
`DEVICE_SPLIT_LIMIT`.

## Stack

Smoke creates a board with the smoke project and a member; the member sees the task on the board,
leaves the board; the owner deletes it.

## Done when

Common criteria from the stage README.

## Show the customer

Creating a board, its projects and members, task visibility by project, leaving and deleting.
