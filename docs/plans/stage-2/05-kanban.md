# Step 5 — kanban and the task modal

Read first: [ADR-0029](../../adr/0029-boards-over-projects.md), the stage [README](README.md).
Step 4 must be merged.

## Server

- `CreateTaskRequest.statusId` — optional; absent → the status with `isDefault`. Validate it with the
  existing `taskstatus` tag.
- `entity.NewTask` and `TaskFactory.New` take the status.
- Contract: add the field and update the `createTask` description, which says the status is always
  the default one.
- Tests: a task is created right in the given status; a bad status → `422` with `details.statusId`;
  without `statusId` — the default status.

## Kanban

`KanbanBoard` on `/boards/$id`, on real data, replaces the task list of step 4 on that page.

- **Columns** — statuses from `useTaskStatuses`, with the task count. No tasks — no count
  (comment in frame `976:39083`).
- **Swimlanes** — board members (owner first), and «Без ответственного» last.
- With one board member there are no swimlanes: all tasks go into the columns (`980:35751`).
- A swimlane can be collapsed (`980:35550`, animation `980:37046`). Collapsed lanes are kept in
  `localStorage` per board; reads and writes are wrapped in `try/catch`.
- Frames: phone `980:35027`, `980:37262`, `980:33128`; tablet `1522:191921`, `1522:192665`;
  desktop `1775:155083`, `1808:70345`, `1808:85950`, `1808:86189`.
- Delete `KanbanBoard.mocks.ts` and `MockTask`; `useKanbanDragDrop` works with `Task`.

## Cards

- A card shows the key as a caption and the name, up to three lines.
- From 1024 px a click on the card opens the task in a modal over the board (`1892:103887`,
  `1892:104765`). `MODAL_TYPE.TASK` *(new)* in `presentation/app/components/GlobalModalContext.tsx`
  shows `TaskInfo` and `TaskActivity`. A click on the key opens the page `/tasks/$taskId`
  (comment `1888:101344`).
- Below 1024 px a click on the card opens the task page.

## Drag and drop

`dnd-kit` is already used (`useKanbanDragDrop`).

- Into another column — `useChangeTaskStatus`.
- Into another swimlane — `useChangeTaskAssignee` with the lane's user; into «Без ответственного» —
  `null`.
- Both changed — two requests, status first.
- The card moves at once. On an error it goes back, and a toast shows the text for the code, for
  example `ASSIGNEE_NOT_MEMBER`.
- Do not highlight a drop place in the lane of a person who is not a member of the task's project.
  Load members of the board's visible projects with the existing project members hook.
- No reordering within a column: order by `updatedAt`.
- Drag visuals — frames `1010:41908`…`1010:43548` and the comments in them; auto-scroll at the edges —
  `dnd-kit` `autoScroll`.

## Create a task from a column

«Создать задачу» in an empty cell or «+» after the cards (comments `980:37533`, `980:37537`) open the
new task form with:

- status — the column's (`statusId`);
- assignee — the lane's user, if they are a member of the chosen project;
- project — the only visible board project, otherwise a choice among the visible board projects.

The floating «Создать задачу» on the board info page keeps the default status.

## Scrolling

On a phone the board scrolls sideways, swimlane names stay in place, column headers stick to the top
(frames `980:37541`…`980:37951` and their comments).

## Stack

Smoke creates a task right in the `in_progress` status via `statusId`.

## Done when

Common criteria from the stage README.

## Show the customer

The kanban at three widths, drag and drop, creating a task from a column, the task modal.
