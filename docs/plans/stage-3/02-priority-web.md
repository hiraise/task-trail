# Step 2 — priority in the web and the shared card line `TaskMeta`

Read first: [ADR-0033](../../adr/0033-task-priority.md), the stage [README](README.md), the approved
artboards A, B, C, D, H, I and «Approved values» in [00-mockups.md](00-mockups.md). Step 1 must be merged:
`Task.priority`, `PATCH /v1/tasks/{taskId}/priority` and their generated types exist. Names marked
*(new)* do not exist yet.

This step also creates `TaskMeta` — the line of small badges under a task name in all cards. Steps 4,
6 and 9 add their badges to it.

## Model, mapper, repository

- `web/src/domain/types/EntityIds.ts`: `export type TaskPriorityId = "low" | "normal" | "high" | "urgent";`
  (`domain/types/index.ts` already re-exports the whole file).
- `web/src/domain/models/TaskPriority.ts` *(new)*:

  ```ts
  /** Priorities from the most urgent — the order of pickers and of the «По приоритету» sort (ADR-0033). */
  export const TASK_PRIORITY_ORDER: readonly TaskPriorityId[] = ["urgent", "high", "normal", "low"];
  export const DEFAULT_TASK_PRIORITY: TaskPriorityId = "normal";
  ```

- `Task.priority: TaskPriorityId` in `domain/models/Task.ts`; `TaskEvent` gets
  `fromPriority?: TaskPriorityId; toPriority?: TaskPriorityId` and the kind `"priority_changed"` in
  `TaskEventKind`.
- `mappers.ts`: `toTask` copies `priority`; `toTaskEvent` maps `fromPriority`/`toPriority`
  (`null` → `undefined`). `mappers.test.ts` (type-checked by `tsc -b`): add `priority` to the `dto` of
  `describe("toTask")`, to its expected object and to the task inside `describe("toSearchResult")`; add
  `fromPriority: null, toPriority: null` to the `dto` of `describe("toTaskEvent")` and a test "keeps the
  priority change".
- `NewTask.priority?: TaskPriorityId` in `domain/repositories/TaskRepository.ts`; `apiTaskRepository.create`
  sends `priority` when it is set.
- `changePriority(id: TaskId, priority: TaskPriorityId): Promise<Task>` *(new)* in `TaskRepository` and
  `apiTaskRepository` (copy `changeStatus`); `API_ROUTES.TASK_PRIORITY(id)` = `/v1/tasks/{id}/priority`
  in `apiRoutes.ts`.
- `ChangeTaskPriorityPayload { taskId; priority }` *(new)* in `application/payloads/taskPayload.ts`.
- Fix fixtures that build a full `Task` (search `projectArchived:` in `web/src`): add `priority: "normal"`.

## Texts

`shared/locales/tasks.ts`, in `tasksTexts`:

- `priority: "Приоритет"`;
- `priorities: { urgent: "Срочный", high: "Высокий", normal: "Обычный", low: "Низкий" }` — typed
  `Record<TaskPriorityId, string>`;
- `changePriorityFailed: "Не удалось изменить приоритет"`;
- `events.priority: "Приоритет: {from} → {to}"`.

Sort option label in `SortItems.types.ts`: `{ value: "priority", label: "По приоритету" }`.

## Icons and tokens

- Icons from «Approved values» of step 0: the priority icon(s) in `web/src/assets/icons/`, registered in
  `ICONS` (`shared/config/icons.ts`) — at least `ICONS.priority` for the field row.
- Tokens `--priority-urgent`, `--priority-high`, `--priority-low` in `web/src/styles/globals.css` with the
  approved values (light theme, and dark if `globals.css` has a dark block).

## Shared components

- `PriorityIcon` *(new)* — `presentation/shared/components/PriorityIcon/` (`PriorityIcon.tsx`,
  `PriorityIcon.module.css`, `index.ts`), export it from `presentation/shared/components/index.ts`:
  props `{ priority: TaskPriorityId; size?: string }`; renders `<span role="img" aria-label title>`
  (texts from `tasksTexts.priorities`) with the class of the priority (`.urgent { color:
  var(--priority-urgent) }`, `.normal { color: var(--icon-secondary) }` …) wrapping
  `<Icon as={…} size={size} inheritColor />`. Do not pass `className` to `Icon`: it replaces `Icon`'s own
  class.
- `TaskMeta` *(new)* — `presentation/shared/components/TaskMeta/` (`TaskMeta.tsx`, `TaskMeta.module.css`,
  `TaskMeta.test.tsx`, `index.ts`), exported the same way:

  ```tsx
  /**
   * The badges under a task name in every card (artboard A of stage 3): priority now; due date,
   * subtasks and labels are added by later steps. Nothing to show — renders nothing.
   */
  export function TaskMeta({ task }: { task: Task }) {
    const items: ReactNode[] = [];
    if (task.priority !== "normal") items.push(<PriorityIcon key="priority" priority={task.priority} size="16px" />);
    if (items.length === 0) return null;
    // A span: the line sits inside the span.text of ProjectTask and «Мои задачи»
    return <span className={styles.meta}>{items}</span>;
  }
  ```

  CSS: `display: flex`, `gap: 8px`, `align-items: center`, `flex-wrap: wrap`, text `caption-reg` in
  `--text-secondary`. Test: `normal` renders nothing; `urgent` renders the icon with the label «Срочный».
- Add both components to `docs/design-system.md` (a new «Task cards» paragraph: `TaskMeta`,
  `PriorityIcon`, the priority tokens).

## Cards

Show `<TaskMeta task={task} />` under the task name:

- `features/projects/components/ProjectTask/ProjectTask.tsx` — add an optional prop `task?: Task` and
  render `TaskMeta` inside `span.text` after the title; pass `task` from its callers:
  `ProjectTask/TaskList.tsx`, `boards/components/BoardTasks/BoardTasks.tsx`,
  `search/components/SearchTaskList/SearchTaskList.tsx`;
- `features/tasks/components/TaskList/TaskList.tsx` («Мои задачи») — under `span.name`;
- `features/boards/components/KanbanBoard/KanbanCard.tsx` — under `span.name`.

## Changing the priority

- `useChangeTaskPriority` *(new)* in `features/tasks/hooks/` — copy `useChangeTaskStatus`
  (`onSuccess: storeTask`, `onError: toastError(error, tasksTexts.changePriorityFailed)`); export it from
  `hooks/index.ts`.
- `TaskPriorityList` *(new)* in `features/tasks/components/TaskPriorityList/` — like `TaskStatusList`
  (`role="radiogroup"`, props `{ selectedId, onSelect }`), rows in `TASK_PRIORITY_ORDER`, each with
  `PriorityIcon` (also for `normal` here) and the name. The shared `RadioButton` renders `option.label`
  as a string and cannot hold an icon: give `RadioButton` an optional `icon?: ReactNode` rendered before
  the label (a shared change — note it in `docs/design-system.md`), and use it here.
- `ChangeTaskPriorityModal` *(new)* in `features/tasks/modals/ChangeTaskPriorityModal/` — copy
  `ChangeTaskStatusModal`; title `tasksTexts.priority`. Register it in the five places (stage README,
  «A modal»): `MODAL_TYPE.CHANGE_PRIORITY`, `ChangePriorityProps { priority?: TaskPriorityId }`,
  `showChangePriority(props): Promise<TaskPriorityId | undefined>`.
- `useTaskActions`: `changePriority` — opens `showChangePriority({ priority: task.priority })` and calls
  the mutation only if the value changed.
- `TaskInfo`: a third `TaskField` after «Проект»: `icon={ICONS.priority}`,
  `label={tasksTexts.priority}`, `value={tasksTexts.priorities[task.priority]}`,
  `onClick={archived ? undefined : changePriority}`.

## The new task form

- `features/tasks/store/createTaskFormStore.ts`: `priority: TaskPriorityId` and `setPriority`; put
  `priority: DEFAULT_TASK_PRIORITY` into its `empty` object — `reset` sets `empty`.
- `CreateTaskForm.tsx`: a `SelectionField` after the project field: `icon={ICONS.priority}`,
  `placeholder={tasksTexts.priority}` (required prop), `value={tasksTexts.priorities[priority]}`,
  `onClick` — `showChangePriority({ priority })`, then `setPriority`. Submit sends `priority`.

## Feed

`features/tasks/components/TaskActivity/feed.ts`: `DESCRIBE.priority_changed` →
`interpolate(texts.priority, { from, to })` where each side is
`event.fromPriority ? tasksTexts.priorities[event.fromPriority] : ""` (the fields are optional, guard
them like `status_changed` does).
Test in `feed.test.ts`: «Приоритет: Обычный → Срочный».

## Sorting

- `shared/utils/sortItems.ts`: `SortOptionValue` gets `"priority"`; `SORT_OPTION_VALUES` too;
  `Sortable` gets an optional `priority?: TaskPriorityId`; the comparator — by the index in
  `TASK_PRIORITY_ORDER` (an item without `priority` goes last), ties — `newestFirst("updatedAt")`.
  Test in `sortItems.test.ts` (create it if missing).
- `TASK_SORT_OPTIONS` *(new)* in `sortItems.ts`: `["priority"] as const` — options shown only for task
  lists. The flag goes through five places:
  1. `useListSort(listId, { tasks }: { tasks?: boolean } = {})` calls `showSortOptions(sort, tasks)`;
  2. `showSortOptions(current, tasks?)` in `useGlobalModals.ts` opens the modal with `{ current, tasks }`;
  3. `SortOptionsProps` gets `tasks?: boolean`;
  4. `SortItemsModal` reads `tasks` from `useGlobalModalProps` and passes it to `SortItems`;
  5. `SortItemsProps` (`SortItems.types.ts`) gets `tasks?: boolean`; `SortItems` hides options from
     `TASK_SORT_OPTIONS` unless it is set.
- Task lists pass `{ tasks: true }`: `TasksPage` (`"my-tasks"`), `ProjectTaskTabs`
  (`"project-tasks"`), `BoardTasks` (`"board-tasks"`).

## Stack

`scripts/dev.sh up`: create a task with «Срочный», change it to «Низкий» on the task page, see the icon
on the project list, «Мои задачи», the kanban and in the feed; sort a list «По приоритету».

## Done when

Common criteria from the stage README; `TaskMeta` and `PriorityIcon` are in `docs/design-system.md`.

## Show the customer

The priority field on the task page and in the kanban modal, the picker on a phone and on a desktop,
the icons on the three cards, the new task form, the feed line, the sort option.
