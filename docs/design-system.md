# TaskTrail design system

For agents: what the web UI looks like, what it is built from and how to draw a new screen.
The decision that new screen mockups live here and in mockups for approval, not in Figma —
[ADR-0025](adr/0025-design-system-in-repo.md). Web code structure — [ADR-0008](adr/0008-web-architecture.md).

Values live in code; this file says what to use when. Changing a design token or component — update
this file in the same PR if a rule changed.

## New screen

1. Find a similar screen in the web client and take its layout: profile, project page, members.
2. Draw a mockup at 393, 768 and 1200 px on a Design canvas on claude.ai, like the admin section
   mockup (canvas «TaskTrail — раздел администратора»). Only design tokens and components from here;
   a new component or color — a separate line in the message to the customer.
3. States — separate artboards: empty, loading, errors by `ApiError` codes, modals, notifications.
4. Code — after the customer's "yes". A new shared component or design token goes here too.

Existing screens are drawn in Figma (the file is in [CLAUDE.md](../CLAUDE.md)). It is a reference
for them, not a place for new mockups.

## Tokens

Variables only, do not repeat values — `scripts/rules.mjs` checks this (ADR-0008).

| What | Where | Key points |
| --- | --- | --- |
| Backgrounds, icons, borders, shadows | `web/src/styles/globals.css` | page — `--bg-secondary`, card — `--bg-card` and `--shade-01`, field and the «Отменить» button — `--bg-secondary`, form block in a card — `--bg-primary`, dark button — `--bg-primary-contrast` |
| Text and font | `web/src/styles/text.css` | font — `var(--font-family)` (Manrope); text `--text-primary`, label and explanation — `--text-secondary`, description in a modal — `--text-tertiary`, error — `--text-critical` |
| Badges | `--bg-accent-yellow` — admin, `--bg-accent-blue` — member, `--bg-accent-green` — on, `--bg-secondary` — off and «Архив» (`ArchiveTag`) | |
| Accent | `--icon-accent` | selected radio button, link |
| Priority | `--priority-urgent`, `--priority-high`, `--priority-low`; `normal` — `--icon-secondary` | `PriorityIcon` (ADR-0033) |
| Labels | `--label-<color>-bg` and `--label-<color>-text` for `gray`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple` | `LabelChip`, `ColorSwatches` (ADR-0035); text contrast 5:1 and more |

Text classes (`text.css`): `h2` — page and modal title, `h4` — card title,
`body-med` — name, menu item, button on a phone, `body-reg-2` — field labels in a card and explanations,
`caption-reg`/`caption-med` — hints and badges, `btn-font-s`/`btn-font-m` — button text.
A bare element without a class does not get Manrope (global `*` in `globals.css`) — set a class
or `font-family: var(--font-family)`.

## Layout

Breakpoints — `presentation/shared/hooks/useDevice.ts`: phone up to 767 px, tablet 768–1024,
desktop from 1025 px.

- **Phone.** A section screen — bottom navigation `BottomNavBar`; a nested page —
  `PagesMobileTemplate` with a top "back" bar. Items leading to nested pages — `MenuButton`
  (a gray "pill" with an icon in a white circle). The main form button — at the bottom of the page,
  full width.
- **Tablet and desktop.** `DesktopTemplate`: the `Drawer` sidebar and a column of cards with a 16 px
  gap. Card: `--bg-card`, radius 12, shadow `--shade-01`, padding 20–24 px.
- **The bell** (ADR-0038, artboard F of the stage 3 canvas). On a phone — a round 48 px link with
  `ICONS.bell` between search and the menu pill of `BottomNavBar`; on `/notifications` it is
  `--bg-card` with an `--icon-primary` icon inside a 6 px ring of `--bg-primary-contrast`.
  In `Drawer` — «Уведомления» after «Поиск» under the divider. The counter is `UnreadBadge`: in
  `BottomNavBar` and the collapsed `Drawer` on the icon corner with a 2 px ring of the background, in
  the expanded `Drawer` at the right end of the item. The layout reads the count with
  `useUnreadNotifications` (polled every 60 s while the tab is visible) and passes it as a prop.
- **One component per screen** (ADR-0008): phone items and cards are in one component,
  CSS switches between them (`@media (min-width: 768px)`), like `ProfilePage` and `AdminPage`.

## Forms

- Fields — `InputFieldMobile` (label above the field, error — `FormFieldError` below it), limits —
  `presentation/shared/forms/fields.ts`, schema — zod.
- Layout — `presentation/shared/forms/FormLayout`: `inline` — a form block in a card,
  two columns from 1025 px, «Отменить» and «Сохранить» appear when the form is changed;
  `page` — a separate phone page with the button at the bottom.
- An error that belongs to a field (`SECRET_REQUIRED`, `details` of `VALIDATION_FAILED`) — under
  the field; the rest — as a notification (ADR-0024).
- A request longer than a couple of seconds — disable the fields, put «Проверяем…» on the button,
  and next to it — how long to wait.

## Buttons

`SubmitButton`: `primary` — dark, the main action; `secondary` — gray, «Отменить», «Готово»;
`text` — an icon without a background, a minor action. A dangerous action — `text` colored
`--text-critical`, with a confirmation. In a modal — two equal buttons: cancel on the left, action
on the right.

## Modals, menus and notifications

- Modal — `BaseModal` via `useGlobalModals`: a bottom sheet on a phone, a dialog on wider screens.
  A whole entity over a page — `Dialog` with `wide` (880 px, the content scrolls inside) and
  `onDismiss` (a click on the background or Escape closes it), like the task over the kanban
  (`TaskModal`).
  Confirmation — `showConfirm` (`ConfirmModal`): a question as the title, what will happen, a button
  with a verb.
- Actions on a list row: wider than a phone — the «…» menu (`DropdownMenu`); on a phone — tapping
  the row opens the `ActionsMenu` sheet. One hook builds the items for both
  (`useMembersMenuItems`, `useAdminUserMenuItems`).
- Notifications — `sonner` (`toast`, `toastError`), bottom right: success — what was done and to
  whom, error — what is wrong and what to do.

## Lists: tabs, sorting, empty state

- «Активные / Архивные» — `TabPanel` inside `TabPanelProvider` (one provider per list): a segmented
  control on a phone, underlined tabs from 768 px. Next to it — the sort button; the choice is kept per
  list by `useListSort(listId)`, the list is sorted with `sortItems` (`shared/utils/sortItems.ts`).
  The sort modal applies an option on tap and closes. Task lists pass `useListSort(listId, { tasks: true })`:
  the modal then also shows `TASK_SORT_OPTIONS` («По приоритету»).
- An archived task or project shows `ArchiveTag` («Архив», `caption-med` on `--bg-secondary`) in place
  of the status or next to the name; its fields are not clickable (ADR-0027).
- An empty list — `EmptyListState`: a picture, a text and, when there is something to create, a button.
  The archive has no button.
- A search query in names — `HighlightedText`: case-insensitive occurrences in `--text-accent`.
  Cards take it as a `highlight` prop (`ProjectCard`, `BoardListItem`, `ProjectTask`). Another
  feature shows these cards through `presentation/shared/components/domainComponents.ts`.

## Task cards

- The three task cards — the project, board and search row (`ProjectTask`), the «Мои задачи» card
  (`TaskList`) and the kanban card (`KanbanCard`) — show `TaskMeta` under the name: a `caption-reg`
  line of badges in `--text-secondary`, gap 8 px, wrapping: the priority icon, the due date chip,
  subtasks «2/5» (`ICONS.subtasks` 16 px, gap 2 px, only when the task has subtasks) and at most
  3 `LabelChip`s, then «+N». A card with nothing to show has no meta line.
- The due date chip — `ICONS.calendar` 16 px and the date, gap 2 px: «Сегодня», «Завтра», «30 окт»,
  another year «30 окт 2027» (`formatDueDate` in `shared/utils/dueDate.ts`). Overdue — the date is before
  today and the status is not resolved — the chip is `--text-critical` (ADR-0034).
- `PriorityIcon` — the icon of a priority level colored by its token, with the name as `aria-label`
  and `title`. Cards show it for `low`, `high` and `urgent` only (16 px); the «Приоритет» field on the
  task page (24 px), the new task form (18 px) and the picker show it for every level.
- A field with the icon of its current value — `TaskField` and `SelectionField` take `iconNode` in place
  of `icon`.
- `TaskField` with `tone="critical"` draws its value in `--text-critical`: the overdue «Срок» row.
- The due date picker `ChangeDueDateModal` — the native `<input type="date">` styled like `Input`
  (`body-reg` size), «Убрать срок» (`SubmitButton variant="text"`, only when a date is set) and
  `DialogButtons` with «Применить» on every width (artboard C).
- `TaskField` with `children` draws them in place of the value text — a wrapping row, gap 4 px, no
  line clamp; from 768 px the row takes the full width and grows in height — and takes `ariaValue`
  for its `aria-label`: the «Метки» row with chips, «Добавить» when
  empty.
- `TaskStatusBadge` without `onClick` is a caption, not a button: `caption-med`, height 20, padding
  `2px 8px`, radius 6, the status color — the subtask rows.

## Subtasks

Subtasks (ADR-0036), artboards B and C of the stage 3 canvas.

- `TaskSubtasks` — the «Подзадачи» block between the task info and the feed on the task page (its own
  section card) and in `TaskModal`: `h4` and the progress «2 из 5» (`body-reg-2`, `--text-secondary`),
  rows, «Добавить подзадачу» (`SubmitButton variant="text"` with `ICONS.plus`). A row is a link on
  `--bg-secondary-2`, radius 12, padding `10px 12px`: the status caption (`ArchiveTag` for an archived
  subtask), the key, the name, the assignee avatar; on a phone the name is under the status and key,
  from 768 px — one line with «…». Quick adding — `Input` and «Создать» in a row; the field clears after
  each subtask, Escape closes it. Hidden for a subtask; an archived task has no add button.
- A subtask shows «Подзадача DS-12 · Название» (`caption-reg`, `--text-secondary`) as a link above
  its key.
- `SelectParentModal` — «Выберите родительскую задачу»: a search field «Ключ или название» and a list on
  `--bg-secondary` (radius 8), rows of a `caption-reg` key over a `body-reg-2` name; a tap chooses, on
  768+ only «Отменить» below.

## Attachments

Attachments (ADR-0037), artboard B of the stage 3 canvas.

- `TaskAttachments` — the «Вложения» block after «Подзадачи» on the task page (its own section card) and
  in `TaskModal`: `h4` and «Добавить файл» (`SubmitButton variant="text"` with `ICONS.paperclip`) on the
  right; it opens a file dialog with several files. One column; two when the block is 640 px wide or
  more (a container query: the 1200 page and the kanban modal). Empty — «Файлов пока нет»; an archived
  task has no add button and its menu keeps only «Скачать».
- A row — padding 8, radius 12, `--bg-secondary-2` on hover: a 48 px preview (`object-fit: cover`,
  radius 8) for JPEG, PNG and WebP, otherwise `ICONS.file` (`--icon-secondary`) on a 48 px
  `--bg-secondary` square; the name (`body-med-2`, one line with «…») over «2,4 МБ · Автор ·
  27.10.2026» (`caption-reg`, `--text-secondary`). A click on the row downloads; the «…» menu —
  «Скачать» (`ICONS.download`) and «Удалить» for the uploader, the owner and admins (with a confirmation).
- While uploading the button reads «Загружаем…» and is disabled; each waiting file has a row at 60 %
  opacity with `ICONS.file` and «Загружаем…»; a file over 25 MB is not sent — a toast names it.

- A radio row with an icon — `RadioButton` with `icon` (before the label, gap 8 px), like the priority
  picker `TaskPriorityList`.

## Labels

Labels of a project (ADR-0035), artboards C and I of the stage 3 canvas.

- `LabelChip` (`presentation/shared/components/LabelChip`) — a pill `caption-med`, height 20, padding
  `2px 8px`, radius 8, colors `--label-<color>-bg`/`-text`; a name longer than 160 px ends with «…»
  and shows in full in `title`.
- `ColorSwatches` (`presentation/shared/components/ColorSwatches`) — 8 round 24 px swatches in the
  palette order, gap 12; the selected one has `outline: 2px solid var(--border-accent)`,
  `outline-offset: 2px`. A `radiogroup` of `radio` buttons named by the color.
- The picker `SelectLabelsModal` (`features/labels`) — a search field «Найти или создать метку», rows
  `CheckBox` + `LabelChip` (min height 36, padding `6px 4px`, gap 12), the whole row toggles; at 10
  selected the other rows are disabled — the checkbox and the chip at opacity 0.4 — and «Не больше 10 меток»
  shows under the list. No exact name
  match — the block «Создать метку «…»» on `--bg-secondary-2` (radius 8): it opens the caption «Цвет»,
  `ColorSwatches` and the preview chip with «Создать». `DialogButtons` with «Применить» on every width,
  full screen on a phone.
- `CheckBox` takes `disabled` (opacity 0.4, no change, `aria-disabled`) and `aria-label`.

## Notifications

Notifications (ADR-0038), artboard F of the stage 3 canvas.

- `UnreadBadge` (`presentation/shared/components/UnreadBadge`) — props `{ count, className }`;
  nothing for 0, «99+» above 99, `aria-label` «N непрочитанных». A pill: height 18, min width 18,
  padding `0 5px`, radius 9, `--icon-accent` background, `--text-primary-contrast` text 10/12 at
  weight 600 (`caption-2-med` at 600). No new tokens.
- `NotificationsPage` (`features/notifications`) — the title «Уведомления» and «Прочитать все»
  (`SubmitButton variant="text"`, opacity 0.6 when there is nothing unread); on a phone the button is
  at the top of the list on the right. A row `NotificationItem` — padding 12, radius 12, gap 12: the
  actor's `UserAvatar` or, for reminders, `ICONS.calendar` in a 32 px `--bg-secondary` circle
  (`--icon-critical` for overdue); the sentence 14/18 with the actor at weight 500; the comment start
  in `body-reg-2` gray; «DS-12 · Название» and the time in `caption-reg` gray, one line with «…»;
  unread — `--bg-secondary-2` and an 8 px `--icon-accent` dot. A click marks it read and opens the task.
- Empty — `EmptyListState` with our picture (a bell in a light blue circle,
  `assets/elements/notifications-empty.svg`); loading — six `aria-busy` placeholder rows on
  `--bg-secondary`.
- The profile switch «Письма об уведомлениях» — `CheckBox` and the text (the text toggles too), under it
  the hint about 5 minutes or, without mail, «Почта не подключена администратором…» in
  `--text-secondary`. On a phone above sign-out; wider — the third block of the profile card with `h4`
  «Уведомления».

## People lists

Row — `UserAvatar` (photo or initials), name `body-med`, email `body-reg-2` in gray; no name —
email only. Badges next to the name: «вы», role. One column on a phone, wider — a grid
`repeat(auto-fill, minmax(320px, 1fr))`.

## Icons

SVG in `web/src/assets/icons/`, `currentColor` stroke 1.1–1.4 thick on a 24 px grid; registration —
`shared/config/icons.ts`, rendering — `Icon`. A new icon — in the same style, our own, no third-party
icon sets.
