# Step 9 — subtasks in the web

Read first: [ADR-0036](../../adr/0036-subtasks.md), the stage [README](README.md), artboards A, B, C and
«Approved values» in [00-mockups.md](00-mockups.md). Step 8 must be merged. Names marked *(new)* do not
exist yet.

## Model, mapper, repository

- `Task`: `parentId?: TaskId`, `subtasksTotal: number`, `subtasksDone: number`; `TaskEventKind` gets
  `"parent_changed"` (it uses the existing `fromKey`/`toKey`).
- `toTask` with tests; the task DTOs of `describe("toTask")` and `describe("toSearchResult")` and other
  fixtures get `parentId: null, subtasksTotal: 0, subtasksDone: 0`.
- `NewTask.parentId?: TaskId`; `apiTaskRepository.create` sends it.
- `TaskRepository`: `findSubtasks(id): Promise<Task[]>`, `changeParent(id, parentId: TaskId | null):
  Promise<Task>` *(new)*; routes `TASK_SUBTASKS(id)`, `TASK_PARENT(id)`.
- `QUERY_KEYS.task.subtasks(id)` = `["task", id, "subtasks"]`.

## Cache

`storeTask` (`taskCache.ts`) also invalidates `task.subtasks(task.id)`, and when `task.parentId` is set —
`task.detail(parentId)` and `task.subtasks(parentId)`: a subtask change moves the parent's counters.
A `parentId` change must refresh the old parent too:
- `useChangeTaskParent` reads the previous `parentId` from the cached task (`task.detail(taskId)`) before
  the mutation and invalidates its `task.detail` and `task.subtasks`;
- `useMoveTask` has the pre-move task in its payload (`{ task, project }`): invalidate `task.detail` and
  `task.subtasks` of `task.parentId`; when `task.subtasksTotal > 0` invalidate `QUERY_KEYS.task.all` —
  the server detached its subtasks;
- `useDeleteTask` does not use `storeTask`: add the same two rules (the parent of a deleted subtask; all
  tasks when a parent with subtasks is deleted).

## Texts

`tasksTexts`: `subtasks: "Подзадачи"`, `subtasksProgress: "{done} из {total}"`, `addSubtask: "Добавить
подзадачу"`, `subtaskNamePlaceholder: "Название подзадачи"`, `noSubtasks: "Подзадач пока нет"`,
`subtaskOf: "Подзадача"`, `makeSubtask: "Сделать подзадачей…"`, `detachFromParent: "Отвязать от
родителя"`, `chooseParent: "Выберите родительскую задачу"`, `noParentCandidates: "Нет задач, к которым
можно привязать"`, `createSubtaskFailed: "Не удалось создать подзадачу"`, `changeParentFailed: "Не
удалось изменить родителя"`, `events.parentSet: "Стала подзадачей {key}"`, `events.parentRemoved: "Больше
не подзадача {key}"`, `events.parentChanged: "Подзадача: {from} → {to}"`.

## Icons

`ICONS.subtasks` from «Approved values».

## Hooks (`features/tasks/hooks/`)

- `useSubtasks(taskId)` — `useQuery` with `task.subtasks(taskId)`.
- `useCreateSubtask()` — `taskRepository.create({ projectId, name, parentId })`; `onSuccess` —
  `setQueryData(task.detail(id))`, invalidate `task.subtasks(parentId)`, `task.detail(parentId)` and
  `invalidateTaskLists(queryClient, projectId, { countChanged: true })`; does **not** navigate (unlike
  `useCreateTask`); `toastError(error, createSubtaskFailed)`.
- `useChangeTaskParent()` — mutation `{ taskId, parentId }`, `storeTask` plus the old-parent invalidation
  above, `toastError(error, changeParentFailed)`.

## Components

- `TaskSubtasks` *(new)* — `features/tasks/components/TaskSubtasks/` (`.tsx`, `.module.css`, test):
  props `{ task: Task; readOnly: boolean }`. Hidden for a task that is itself a subtask (one level).
  - Header: `h4` «Подзадачи» and `subtasksProgress` when `subtasksTotal > 0`.
  - Rows from `useSubtasks`: `TaskStatusBadge`-like caption (status name from `useTaskStatuses`, not
    clickable), key, name, assignee avatar — a `Link` to `/tasks/$taskId`; an archived subtask carries
    `ArchiveTag`. Reuse `ProjectTask` through `presentation/shared/components/domainComponents.ts` if it
    fits the mockup; otherwise a local row component.
  - When not `readOnly`: `SubmitButton text` with `ICONS.plus` «Добавить подзадачу» → an inline `Input`
    (`subtaskNamePlaceholder`, `taskNameField` validation); Enter or «Создать» calls `useCreateSubtask`,
    the field stays open and clears for the next one; Escape closes it and calls
    `event.stopPropagation()` — otherwise the kanban `TaskModal` closes too.
  - Row links call `closeAllModals()` before navigating, so a click inside `TaskModal` does not leave the
    dialog open over the new page (stage README, «Web»).
  - Empty — `noSubtasks`.
  - Test: hidden for a subtask; the progress text; the add field creates with `parentId`.
- Parent link — in `TaskInfo` above the key: call `useTask(task.parentId ?? "")` unconditionally (hooks
  cannot be conditional; `useTask` is disabled for an empty ID) and, when `task.parentId` is set, show a
  `Link` «Подзадача DS-12 · Название» (`caption-reg`, `--text-secondary`) that calls `closeAllModals()`
  before navigating; while the parent loads — only «Подзадача».
- `SelectParentModal` *(new)* — `features/tasks/modals/SelectParentModal/`, `BaseModal` `fullScreen` on a
  phone, title `chooseParent`: `SearchField` and tasks of the project (`useProjectTasks(projectId)`,
  active ones) filtered by key or name; candidates exclude the task itself, tasks with `parentId`, and —
  when the task has subtasks — everything (show `noParentCandidates`; the menu item is hidden then
  anyway). A tap returns the task. Register in the five places: `MODAL_TYPE.SELECT_PARENT`,
  `SelectParentProps { projectId; taskId }`, `showSelectParent(props): Promise<Task | undefined>`.
- `useTaskMenuItems`: two items for an active task — «Сделать подзадачей…» (`ICONS.subtasks`) when the
  task has no parent and `subtasksTotal === 0` → `showSelectParent` → `useChangeTaskParent`;
  «Отвязать от родителя» when `parentId` is set → `useChangeTaskParent({ parentId: null })`.
  `subtasksTotal` skips archived subtasks — the server still answers `422 TASK_PARENT_INVALID` for a task
  with archived subtasks, and the toast shows its text.

## Placement

Render the block between the info and the feed in both:
- `features/tasks/pages/TaskPage/TaskPage.tsx` — a new `<section>` card:
  `<TaskSubtasks task={data.task} readOnly={isTaskArchived(data.task)} />`;
- `features/tasks/modals/TaskModal/TaskModal.tsx` — inside `.body`, after `section.info`, the same props
  from its `useTaskDetail` data.

## Cards — `TaskMeta`

After the due date, before labels: when `subtasksTotal > 0` — `ICONS.subtasks` 16 px and
`{subtasksDone}/{subtasksTotal}`. Test: «2/5».

## Feed

`feed.ts` `DESCRIBE.parent_changed`: only `toKey` → `parentSet`; only `fromKey` → `parentRemoved`; both →
`parentChanged`. Tests in `feed.test.ts`.

## Stack

On the stack: add three subtasks from a task page, finish one (progress «1 из 3» and «1/3» on cards), open
a subtask (the parent link), detach it, attach another task through «Сделать подзадачей…», check the
kanban modal.

## Done when

Common criteria from the stage README.

## Show the customer

The subtasks block on a phone and a desktop and in the kanban modal, quick adding, the parent link,
attach and detach from the menu, the counters on cards, the feed lines.
