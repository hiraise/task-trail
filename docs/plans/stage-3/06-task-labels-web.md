# Step 6 — labels on a task in the web

Read first: [ADR-0035](../../adr/0035-project-labels.md), the stage [README](README.md), artboards A, B,
C, I and «Approved values» in [00-mockups.md](00-mockups.md). Step 5 must be merged. Project label
management (rename, recolor, delete) is [step 7](07-project-labels-web.md). Names marked *(new)* do not
exist yet.

## Model, mapper, repositories

- `web/src/domain/types/EntityIds.ts`: `LabelId`.
- `web/src/domain/models/Label.ts` *(new)*:

  ```ts
  export type LabelColor = "gray" | "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple";
  /** The palette in the order of the color picker (ADR-0035). */
  export const LABEL_COLORS: readonly LabelColor[] = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "purple"];
  export const MAX_TASK_LABELS = 10;
  export interface Label { id: LabelId; projectId: ProjectId; name: string; color: LabelColor }
  ```

- `Task.labels: Label[]`; `toLabel` *(new)* and `toTask` (`labels: dto.labels.map(toLabel)`) in
  `mappers.ts`, tests in `mappers.test.ts`; `labels: []` in the task DTOs of `describe("toTask")` and
  `describe("toSearchResult")`.
- `LabelRepository` *(new)* in `domain/repositories/LabelRepository.ts`:
  `findByProject(projectId)`, `create(projectId, data: LabelData)`, `update(projectId, labelId,
  changes: Partial<LabelData>)`, `delete(projectId, labelId)` where `LabelData = { name; color }`;
  `apiLabelRepository.ts` *(new)* in `infrastructure/repositories/` (export `labelRepository` from the
  barrel), routes `PROJECT_LABELS(projectId)` and `PROJECT_LABEL(projectId, labelId)` in `apiRoutes.ts`.
  Step 7 uses `update` and `delete`; write all four now.
- `TaskRepository.setLabels(id: TaskId, labelIds: LabelId[]): Promise<Task>` *(new)*,
  `API_ROUTES.TASK_LABELS(id)`, `http.put`.
- Fixtures with a full `Task`: `labels: []`.

## Tokens and shared components

- Tokens `--label-<color>-bg` and `--label-<color>-text` for the 8 colors in `web/src/styles/globals.css`,
  values from «Approved values».
- `LabelChip` *(new)* — `presentation/shared/components/LabelChip/` (`LabelChip.tsx`, `.module.css`,
  `index.ts`, exported from `presentation/shared/components/index.ts`): props `{ label: Label }`;
  a pill `caption-med`, padding `2px 8px`, radius 8, classes `.gray { background: var(--label-gray-bg);
  color: var(--label-gray-text) }` … one per color; long names end with `…` (`max-width: 160px`,
  `text-overflow: ellipsis`).
- `ColorSwatches` *(new)* — `presentation/shared/components/ColorSwatches/`: props
  `{ value: LabelColor; onChange(color) }`; 8 round buttons 24 px in `LABEL_COLORS` order with
  `--label-<color>-bg`, the selected one with a 2 px `--border-accent` ring; `role="radiogroup"`,
  each `role="radio"` with `aria-checked` and `aria-label` from `tasksTexts.labelColors`. Test: a click
  calls `onChange` with the color.
- `docs/design-system.md`: «Labels» — the tokens, `LabelChip`, `ColorSwatches`.

## Texts

`tasksTexts`: `labels: "Метки"`, `addLabels: "Добавить"`, `searchLabels: "Найти или создать метку"`,
`createLabel: "Создать метку «{name}»"`, `labelsLimit: "Не больше 10 меток"`, `noLabels: "В проекте пока
нет меток"`, `labelColor: "Цвет"`, `labelColors: { gray: "Серый", red: "Красный", orange: "Оранжевый",
yellow: "Жёлтый", green: "Зелёный", teal: "Бирюзовый", blue: "Синий", purple: "Фиолетовый" }`,
`setLabelsFailed: "Не удалось изменить метки"`, `createLabelFailed: "Не удалось создать метку"`.
`labelNameField` *(new)* in `presentation/shared/forms/fields.ts`: `z.string().trim().min(1, "Заполните
поле").max(30, "Название длиннее 30 символов")`.

## Feature `labels` *(new)*

`web/src/presentation/features/labels/` with `hooks/`, `components/`, `modals/` and `index.ts` barrels.
Other features import it by a relative path: `../../labels/hooks` from a `hooks/` folder,
`../../../labels/hooks` from `components/X/` or `modals/X/` (stage README, «Web»).

- `QUERY_KEYS.project.labels(id)` = `["project", id, "labels"]`.
- `useProjectLabels(projectId)` — `useQuery`, `labelRepository.findByProject`, `staleTime` 5 minutes.
- `useCreateLabel()` — mutation `{ projectId, data }`; `onSuccess` — invalidate
  `project.labels(projectId)`; `onError` — `LABEL_NAME_TAKEN` is shown by the caller under the field,
  other errors — `toastError(error, tasksTexts.createLabelFailed)`.
- `LabelOptions` *(new)* component (`components/LabelOptions/`): props `{ projectId, selectedIds,
  onChange(ids) }`:
  - `SearchField` on top (`tasksTexts.searchLabels`), filtering case-insensitively by name;
  - rows: `CheckBox` + `LabelChip`; a click on the row toggles the ID; with `MAX_TASK_LABELS` selected,
    unselected rows are disabled and `tasksTexts.labelsLimit` shows under the list. The shared
    `CheckBox` has only `{ checked?, onChange }`: give it `disabled?: boolean` (no `onChange` call,
    `aria-disabled`, dimmed with `opacity: 0.4`) and `aria-label?: string` — a shared change, note it in
    `docs/design-system.md`;
  - when the trimmed query has no exact match (ignoring case), the last row is
    `interpolate(tasksTexts.createLabel, { name })`; it opens an inline form: `ColorSwatches` (default
    `gray`) and a primary «Создать» button; on success the new label is selected and the query clears;
    `LABEL_NAME_TAKEN` → `FormFieldError` under the row;
  - an empty project and no query — `tasksTexts.noLabels`.
  - Test `LabelOptions.test.tsx` (mock the hooks): filtering, toggling, the limit, the create row
    appears only without an exact match.
- `SelectLabelsModal` *(new)* (`modals/SelectLabelsModal/`): `BaseModal` with `fullScreen` on a phone
  (like `SelectAssigneeModal`), title `tasksTexts.labels`, `LabelOptions` with local state, and
  `DialogButtons` «Применить» on every width (a multi-choice does not close on a tap). Returns
  `LabelId[]`. Register in the five places: `MODAL_TYPE.SELECT_LABELS`,
  `SelectLabelsProps { projectId: ProjectId; labelIds: LabelId[] }`, `showSelectLabels(props)`.

## Task page

- `useSetTaskLabels` *(new)* in `features/tasks/hooks/` — mutation `{ taskId, labelIds }`, `storeTask`,
  `toastError(error, tasksTexts.setLabelsFailed)`.
- `useTaskActions.selectLabels` — `showSelectLabels({ projectId, labelIds: task.labels.map(l => l.id) })`;
  send only when the set changed (compare sorted IDs).
- `TaskField` gets `children?: ReactNode`: when given, it replaces the `.text` span (a wrapping row of
  chips, `gap: 4px`, no line clamp), the `.empty` gray style is not applied, and `aria-label` becomes
  `"${label}: ${names}"` — pass the names as a new prop `ariaValue?: string` (here
  `task.labels.map(l => l.name).join(", ")`).
- `TaskInfo`: a row after «Срок»: `icon={ICONS.label}`, `label={tasksTexts.labels}`,
  `placeholder={tasksTexts.addLabels}`, children — `task.labels.map(LabelChip)` and `ariaValue` when not
  empty,
  `onClick={archived ? undefined : selectLabels}`.
- `ICONS.label` from «Approved values».

## Cards — `TaskMeta`

After the due date: at most 3 `LabelChip`s, then `+N` (`caption-reg`, `--text-secondary`) when there are
more. Test: 5 labels → 3 chips and «+2».

## Stack

On the stack: open a task, create a label from the picker, pick two, see them on the page, the project
list, «Мои задачи» and the kanban; move the task to another project — labels are gone; try an 11th label.

## Done when

Common criteria from the stage README.

## Show the customer

The labels row and the picker (search, create with a color, the limit) on a phone and a desktop, chips
on the three cards, a move removing labels.
