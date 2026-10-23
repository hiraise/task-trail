# Step 7 — project labels management in the web

Read first: [ADR-0035](../../adr/0035-project-labels.md), the stage [README](README.md), artboard E and
«Approved values» in [00-mockups.md](00-mockups.md). Step 6 must be merged: the `labels` feature,
`labelRepository`, `LabelChip`, `ColorSwatches` and the label tokens exist. Names marked *(new)* do not
exist yet.

## Permissions

`canManageLabels(role: ProjectRole)` *(new)* in `web/src/shared/utils/userRole.ts` — `owner` or `admin`,
with a test next to the existing role tests. Every member sees the labels; only managers see
«Изменить», «Удалить», «Новая метка». In an archived project (`isProjectArchived`) nobody changes them.

## Hooks — `features/labels/hooks/`

- `useUpdateLabel()` — mutation `{ projectId, labelId, changes }`; `onSuccess` — invalidate
  `project.labels(projectId)` and the task caches that show labels: `QUERY_KEYS.task.all`
  (`["task"]`), `project.taskLists(projectId)` and `board.prefix`; `toast.success(labelUpdated)`.
- `useDeleteLabel()` — the same invalidation, `toast.success(labelDeleted)`.
- Errors: `LABEL_NAME_TAKEN` is shown under the name field; others — `toastError` with
  `updateLabelFailed` / `deleteLabelFailed`.

## Texts

`tasksTexts` (or a new `labelsTexts` in `shared/locales/labels.ts` if `tasks.ts` grows too long):
`projectLabels: "Метки проекта"`, `newLabel: "Новая метка"`, `labelName: "Название"`, `editLabel: "Изменить"`,
`deleteLabel: "Удалить"`, `deleteLabelTitle: "Удалить метку «{name}»?"`, `deleteLabelDescription: "Она
пропадёт у всех задач проекта."`, `deleteLabelConfirm: "Удалить"`, `labelUpdated: "Метка сохранена"`,
`labelDeleted: "Метка удалена"`, `updateLabelFailed: "Не удалось сохранить метку"`, `deleteLabelFailed:
"Не удалось удалить метку"`, `labelsReadOnly: "Метки меняют владелец и администраторы проекта"`.

## Components — `features/labels/`

- `LabelForm` *(new)* (`components/LabelForm/`): react-hook-form + zod (`labelNameField`), fields — `Input`
  «Название» with `FormFieldError`, `ColorSwatches`; buttons `SubmitButton secondary` «Отменить» and
  `primary` «Сохранить»; props `{ initial?: LabelData; onSubmit(data): Promise<void>; onCancel() }`.
  A `LABEL_NAME_TAKEN` error from `onSubmit` goes under the name field (`setError`). Test: an empty name
  shows the error; submit sends the trimmed name and the color.
- `ProjectLabelsModal` *(new)* (`modals/ProjectLabelsModal/`): `BaseModal`, title `projectLabels`;
  props from `useGlobalModalProps<ProjectLabelsProps>()` — `{ projectId }`; the role and the archive
  flag come from `useProject(projectId)` (`../../../projects/hooks` from `modals/ProjectLabelsModal/`).
  - The list: each row — `LabelChip`; for a manager a `DropdownMenu` with `ICONS.menuHorizontal`:
    «Изменить» turns the row into `LabelForm` with the label's values; «Удалить» — `showConfirm`
    with `deleteLabelTitle`, `deleteLabelDescription`, `deleteLabelConfirm`, then `useDeleteLabel`.
    The global modal stack shows only its top modal: the labels modal unmounts while the confirmation is
    open, so keep no unsaved state across it.
  - Below the list for a manager: `SubmitButton text` with `ICONS.plus` «Новая метка» → an empty
    `LabelForm` that calls `useCreateLabel`.
  - Not a manager: the list only, and `labelsReadOnly` as a hint under it. No labels —
    `tasksTexts.noLabels`.
  - Register in the five places: `MODAL_TYPE.PROJECT_LABELS`, `ProjectLabelsProps`,
    `showProjectLabels(projectId)`.

## Entry point

`features/projects/hooks/useProjectMenuItems.ts`: an item «Метки» (`ICONS.label`) visible for every
member, also in an archived project (read-only view), placed before the archive and delete items; its
action — `showProjectLabels(projectId)`. `ProjectPage` calls `useProjectMenuItems` and passes the items
both to `ProjectInfo` («…» from 768 px) and to the phone top bar (`showProjectSettings`), so one change
covers both. Add `useProjectMenuItems.test.ts` *(new)* for the new item (copy the setup of
`admin/hooks/useAdminUserMenuItems.test.ts`): visible for a member and in an archived project.

## Stack

On the stack: as the owner — open «Метки» from the project menu, create, rename, recolor, delete a label
used by a task (the task loses it); as a member — the list without actions; an archived project —
read-only.

## Done when

Common criteria from the stage README; `docs/design-system.md` mentions `LabelForm` if it went to
shared components (it stays in the feature otherwise).

## Show the customer

The «Метки проекта» modal for the owner and for a member, editing and deleting with the confirmation,
on a phone and a desktop.
