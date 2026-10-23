# Step 4 — due date in the web

Read first: [ADR-0034](../../adr/0034-task-due-date.md), the stage [README](README.md), artboards A, B,
C, D, H and «Approved values» in [00-mockups.md](00-mockups.md). Step 3 must be merged. Step 2 is the
closest example: it added the priority the same way. Names marked *(new)* do not exist yet.

## Model, mapper, repository

- `Task.dueDate?: string` — `YYYY-MM-DD`, a calendar day; `undefined` — no due date.
- `TaskEvent`: `fromDueDate?: string; toDueDate?: string`, kind `"due_date_changed"`.
- `toTask`, `toTaskEvent` (`null` → `undefined`) with tests in `mappers.test.ts`; add `dueDate: null` to
  the task DTOs of `describe("toTask")` and `describe("toSearchResult")`, and `fromDueDate: null,
  toDueDate: null` to the `dto` of `describe("toTaskEvent")` (tests are type-checked).
- `NewTask.dueDate?: string`; `apiTaskRepository.create` sends `dueDate` when set.
- `changeDueDate(id: TaskId, dueDate: string | null): Promise<Task>` *(new)*,
  `API_ROUTES.TASK_DUE_DATE(id)` = `/v1/tasks/{id}/due-date`, `ChangeTaskDueDatePayload`.

## Date helpers — `web/src/shared/utils/dueDate.ts` *(new)*, with `dueDate.test.ts`

The due date is a calendar day: never pass it through `new Date("2026-10-30")` (that is UTC midnight
and shows the previous day west of UTC). Use date-fns `parseISO`, which reads a date-only string as a
local day.

```ts
/** Today's local date as YYYY-MM-DD — what due dates are compared with (ADR-0034). */
export const todayLocal = (now = new Date()) => format(now, "yyyy-MM-dd");

export type DueDateState = "overdue" | "today" | "tomorrow" | "later";

/** How close the due date is; a resolved task is never overdue. YYYY-MM-DD strings compare as dates. */
export function dueDateState(dueDate: string, resolved: boolean, today = todayLocal()): DueDateState;

/** «Сегодня», «Завтра», «30 окт», another year — «30 окт 2027» (date-fns, ru, the trailing dot removed). */
export function formatDueDate(dueDate: string, today = todayLocal()): string;
```

`tomorrow` is `format(addDays(parseISO(today), 1), "yyyy-MM-dd")`. Tests: overdue yesterday, not overdue
when resolved, today, tomorrow, later; `formatDueDate` for each case and another year.

## Texts

`tasksTexts`: `dueDate: "Срок"`, `noDueDate: "Без срока"`, `removeDueDate: "Убрать срок"`,
`today: "Сегодня"`, `tomorrow: "Завтра"`, `changeDueDateFailed: "Не удалось изменить срок"`,
`events.dueDateChanged: "Срок: {from} → {to}"`, `events.dueDateSet: "Срок установлен: {date}"`,
`events.dueDateRemoved: "Срок снят"`. Sort label: `{ value: "dueDate", label: "По сроку" }`.

## Icons and tokens

`ICONS.calendar` from «Approved values». Overdue uses the existing `--text-critical`.

## Status "resolved" in shared components

`TaskMeta` needs to know whether the task's status is resolved. Re-export `useTaskStatuses` from
`presentation/shared/hooks/domainHooks.ts` (like `useProjectTasks`) and use it in `TaskMeta`:
`statuses?.find((s) => s.id === task.statusId)?.isResolved ?? false`. No existing test renders a card
(`SearchPage.test.tsx` mocks `ProjectTask`), but `TaskMeta.test.tsx` from step 2 now needs the hook
mocked — `vi.mock("@/presentation/shared/hooks", async (importOriginal) => …)` like
`search/pages/SearchPage/SearchPage.test.tsx` does.

## Cards — `TaskMeta`

After the priority: a due date chip when `task.dueDate` is set — `ICONS.calendar` 16 px and
`formatDueDate`; the class `.overdue` (`color: var(--text-critical)`) when `dueDateState(...) === "overdue"`.
Tests in `TaskMeta.test.tsx`: «Завтра» for tomorrow; the overdue class for yesterday; no class when the
status is resolved.

## Task page

- `useChangeTaskDueDate` *(new)* — copy `useChangeTaskPriority`.
- `ChangeDueDateModal` *(new)* in `features/tasks/modals/ChangeDueDateModal/` (artboard C):
  - `<input type="date" className={…}>` (style it like `Input`: `--bg-secondary`, radius 8, padding 12,
    `body-reg`, `font-family: var(--font-family)`), initial value from props;
  - `SubmitButton variant="text"` «Убрать срок» — `onClose(null)`; shown only when a date was set;
  - `DialogButtons` — «Применить» returns the input value, an empty input returns `null`.
  - The result type is `string | null`; `undefined` means "closed without a choice" (`safeOpen`).
  - Register in the five places: `MODAL_TYPE.CHANGE_DUE_DATE`, `ChangeDueDateProps { dueDate?: string }`,
    `showChangeDueDate(props): Promise<string | null | undefined>`.
- `useTaskActions.changeDueDate` — open the modal; `undefined` → nothing; a value equal to
  `task.dueDate ?? null` → nothing; otherwise the mutation.
- `TaskField` gets an optional prop `tone?: "critical"` → class `.critical` on the value
  (`color: var(--text-critical)`).
- `TaskInfo`: a row after «Приоритет»: `icon={ICONS.calendar}`, `label={tasksTexts.dueDate}`,
  `value={task.dueDate && formatDueDate(task.dueDate)}`, `placeholder={tasksTexts.noDueDate}`,
  `tone` critical when overdue (resolved — `status?.isResolved` from `TaskInfo`'s own `status` prop),
  `onClick={archived ? undefined : changeDueDate}`.

## The new task form

`features/tasks/store/createTaskFormStore.ts`: `dueDate?: string`, `setDueDate` (`empty` has
`dueDate: undefined`); `CreateTaskForm`: a `SelectionField` after «Приоритет» with `icon={ICONS.calendar}`,
`placeholder={tasksTexts.dueDate}` (required prop), `value={dueDate && formatDueDate(dueDate)}`, opening
`showChangeDueDate`; `null` from the modal clears the date; submit sends `dueDate`.

## Feed

`feed.ts` `DESCRIBE.due_date_changed`: both dates → `dueDateChanged` with `formatDate(parseISO(…))`
(`dd.MM.yyyy`); only `to` → `dueDateSet`; only `from` → `dueDateRemoved`. Three tests in `feed.test.ts`.

## Sorting

`SortOptionValue` gets `"dueDate"`, `TASK_SORT_OPTIONS` = `["priority", "dueDate"]`, `Sortable.dueDate?`.
Comparator: the earliest date first (`localeCompare` of `YYYY-MM-DD`), no date — last, ties
`newestFirst("updatedAt")`. Test in `sortItems.test.ts`.

## Stack

On `scripts/dev.sh up`: set a due date of yesterday on an open task — red on cards and the page; set
«Готово» — not red; remove the date; sort «По сроку»; create a task with a date.

## Done when

Common criteria from the stage README; `docs/design-system.md` mentions the due date chip in `TaskMeta`
and `TaskField`'s `tone`.

## Show the customer

The due date row and picker on a phone and a desktop, «Сегодня/Завтра» and overdue on cards, the feed
lines, the new task form, sorting «По сроку».
