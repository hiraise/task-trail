# Step 2 — archive and list sorting

Read first: [ADR-0027](../../adr/0027-reversible-archive.md), the stage [README](README.md).
Step 1 must be merged: this step uses the project map that `editor.lock` returns.

## Migration `000007_task_archive`

`tasks.archived_at TIMESTAMPTZ`. Projects already have `archived_at`.

## Domain

- `Task.ArchivedAt` and `Project.ArchivedAt` (`*time.Time`).
- Both get `Archive(now)`, `Restore(now)` (they also set `UpdatedAt`) and `RequireActive()` *(new)*.
- `Task.ProjectArchived bool` — read-only, filled by repositories from `p.archived_at IS NOT NULL`,
  like `Task.ProjectKey`.
- Error codes `TASK_ARCHIVED` and `PROJECT_ARCHIVED` → `409` — six places each (stage README).
  Russian texts: «Задача в архиве — её нельзя менять», «Проект в архиве — его нельзя менять».

## Repositories

- Queries read `archived_at`; `TaskRepository.Update` and `ProjectRepository.Update` write it.
- `ProjectRepository.ListViews(userID, archived bool)` — by `p.archived_at`.
- `TaskRepository.ListInProject(projectID, archived bool)` — by `t.archived_at` only.
- `TaskRepository.ListAssigned(userID, archived bool)`: active — `t.archived_at IS NULL AND
  p.archived_at IS NULL`; archived — the opposite.
- `TasksCount` in `projectViews` counts `t.archived_at IS NULL`.
- `TaskRepository.UnassignInProject` keeps clearing the assignee on archived tasks too: do not add
  an archive condition there (ADR-0027).

## Application services

- `editor.edit` checks, after locking and before `apply`: `RequireActive()` of every locked project,
  then `task.RequireActive()`.
- Services that must work on an archived task call `lock` directly and check only the projects:
  - `SetTaskArchivedService` *(new)* — archive or restore; the same value again changes nothing;
  - `DeleteTaskService` — an archived task may be deleted, a task of an archived project may not.
- Task creation checks the project; a move checks both projects (they are both locked).
- In the project module, `Update`, `AddMembers`, `ChangeRole` and `RemoveMember` check
  `project.RequireActive()` after `access.lock`. `Leave` and `Delete` do not.
- `SetProjectArchivedService` *(new)* — owner only; returns the project view like `Update`.
- `AcceptInvitationService` stays as is: accepting adds the member even to an archived project.

## Handlers

- `queryBool(c, name)` *(new)* in `v1/path.go`, next to `queryID`: absent → `false`; `true`/`false`
  → the value; anything else → `422` with `details.<name>`.
- `archived` is read in the handlers of `listProjects`, `listProjectTasks`, `listCurrentUserTasks`.

## Contract

- `Task.archivedAt` and `Project.archivedAt` — required, nullable. `Task.projectArchived` — required
  boolean. `Project.updatedAt` — required (sorting needs it).
- Schema `SetArchivedRequest { archived: boolean }`.
- Operations `setTaskArchived` (`PATCH /v1/tasks/{taskId}/archived`, returns `Task`) and
  `setProjectArchived` (`PATCH /v1/projects/{projectId}/archived`, returns `ProjectDetails`).
- Query parameter `archived` (boolean, default `false`) on `listProjects`, `listProjectTasks` and
  `listCurrentUserTasks`; describe the list rules of ADR-0027 in each.
- `409` with `TASK_ARCHIVED` or `PROJECT_ARCHIVED` on every operation that changes tasks, the project
  or its members.

## Tests

- A table "operation × archived task or archived project → `409`".
- Any member archives a task; only the owner archives a project, a project admin gets `403`.
- Lists with and without `archived`, including tasks of an archived project in «Мои задачи»;
  `tasksCount` skips archived tasks; `projectArchived` is set.
- Deleting an archived task → `204`; leaving an archived project → `204`.
- Leaving a project clears the assignee of an archived task.
- `archived=yes` → `422`.

## Web — data

- `archivedAt` and `projectArchived` in the task model, `archivedAt` and `updatedAt` in the project
  model; mappers with tests.
- Repositories pass `archived` to list requests; tasks and projects get `setArchived(id, archived)`.
- Cache keys keep their prefixes, so `findTaskInLists` and `invalidateTaskLists` still match:
  - `QUERY_KEYS.project.all` becomes `project.list(archived)` = `["project", "all", archived]`;
  - `task.mine` becomes `task.mine(archived)` = `["task", "mine", archived]`;
  - `project.tasks(id)` becomes `project.tasks(id, archived)` = `["project", id, "tasks", archived]`.
  Update every use of the old constants.
- After archiving or restoring a project, refetch project lists, its task lists and «Мои задачи»
  (`QUERY_KEYS.invalidate.project(id)` and the `["task", "mine"]` prefix).
- A task counts as archived in the UI when `archivedAt` is set or `projectArchived` is true.

## Web — screens

- **Tabs** «Активные / Архивные» (`TabPanel`) work on «Мои проекты», «Мои задачи» and the
  «Задачи проекта» section of the project page. Figma has no tabs in the last one — make them like
  in «Мои задачи». Frames: `742:75210`, `1089:92153`.
- **Empty archive.** Projects — frame `911:59975`: «У вас нет ни одного архивного проекта.
  Вы можете добавить в архив любой проект через настройки». Tasks — «Архивных задач нет».
- **Menus.**
  - Task: «Переместить в архив» for an active task; «Вернуть из архива» for an archived one when its
    project is not archived.
  - Project: the same, owner only.
  - In the confirmation (`MoveToArchiveModal`) replace «Отменить это действие будет невозможно» with
    «Вернуть её можно во вкладке «Архивные»» (for a project — «его»).
  - Restoring needs no confirmation; toast «Задача возвращена из архива» or «Проект возвращён из архива».
  - Remove the `toast.warning(…moved to archive)` stubs in `useTaskMenuItems` and `useProjectMenuItems`.
- **Archived task** — frames `1163:44685` (393) and `1581:70407` (768):
  - the phone top bar says «Архивная задача»;
  - a «Архив» tag (`--bg-secondary`, `caption-med`) replaces the status selector;
  - assignee and project fields are not clickable;
  - no comment input and no comment menus;
  - the task menu has only «Вернуть из архива» and «Удалить задачу»; if the project is archived,
    there is no menu at all.
- **Archived project** — frame `742:75070`:
  - a «Архив» tag next to the name;
  - no «Создать задачу», invitation or editing;
  - member cards are not clickable;
  - menu: the owner gets «Вернуть из архива» and «Удалить проект», others — «Покинуть проект».
- **Permissions** in `shared/utils/userRole.ts`: `canArchiveProject` — owner only (remove the stub
  comment); any member archives a task.

## Web — sorting

- The sort modal exists: `SortItemsModal`, options in `SortItems.types.ts`. Make it open with the
  current option.
- `useListSort(listId)` *(new)* keeps the choice in `localStorage` under `tasktrail.sort.<listId>`;
  reads and writes are wrapped in `try/catch`. Default — «По дате последнего обновления».
- `sortItems(items, option)` *(new)* in `shared/utils/sortItems.ts`: dates — newest first, names —
  `localeCompare(…, "ru")`. With a test.
- Use it on «Мои проекты», «Мои задачи» and the project's tasks, on both tabs.
- Frames `1157:25705` and `1159:26899`; behavior — in the comments `1157:18316` and `1636:45413`.

## Mobile/Desktop pairs to merge

`ProjectsDesktopPage` + `ProjectsMobilePage`, `TabPanelDesktop` + `TabPanelMobile`,
`SortItemsDesktop` + `SortItemsMobile`. Then lower `DEVICE_SPLIT_LIMIT`.

## Stack

Smoke archives a task and restores it.

## Done when

Common criteria from the stage README.

## Show the customer

Archiving and restoring a task and a project, read-only archived items, the tabs, sorting.
