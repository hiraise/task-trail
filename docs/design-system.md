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
  line of badges in `--text-secondary`, gap 8 px, wrapping. Now — the priority icon; later steps add
  the due date, subtasks and labels to it. A card with nothing to show has no meta line.
- `PriorityIcon` — the icon of a priority level colored by its token, with the name as `aria-label`
  and `title`. Cards show it for `low`, `high` and `urgent` only (16 px); the «Приоритет» field on the
  task page (24 px), the new task form (18 px) and the picker show it for every level.
- A field with the icon of its current value — `TaskField` and `SelectionField` take `iconNode` in place
  of `icon`.
- A radio row with an icon — `RadioButton` with `icon` (before the label, gap 8 px), like the priority
  picker `TaskPriorityList`.

## People lists

Row — `UserAvatar` (photo or initials), name `body-med`, email `body-reg-2` in gray; no name —
email only. Badges next to the name: «вы», role. One column on a phone, wider — a grid
`repeat(auto-fill, minmax(320px, 1fr))`.

## Icons

SVG in `web/src/assets/icons/`, `currentColor` stroke 1.1–1.4 thick on a 24 px grid; registration —
`shared/config/icons.ts`, rendering — `Icon`. A new icon — in the same style, our own, no third-party
icon sets.
