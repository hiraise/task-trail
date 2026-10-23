# Step 0 — mockups of all stage 3 screens

Read first: [ADR-0025](../../adr/0025-design-system-in-repo.md), [docs/design-system.md](../../design-system.md),
the ADRs of the stage ([README](README.md)), and the «Web» sections of the step files 2, 4, 6, 7, 9, 11, 14
and 16 — they describe what each screen holds; the mockups show how it looks. No code in this step.

## Why one step

The task card and the task page get five new things (priority, due date, labels, subtasks,
attachments). Drawn together they fit; added one by one they would be redrawn five times. The customer
approves everything at once, and web steps implement the approved artboards.

## How

1. Collect the real look: run `scripts/dev.sh up`, sign in (README, «Локальный стенд»), open a project,
   a task, the kanban, «Мои задачи», the profile at 393, 768 and 1200 px. Values — `web/src/styles/globals.css`
   and `web/src/styles/text.css` (Manrope, the `--…` tokens).
2. Create one Design canvas on claude.ai named «TaskTrail — этап 3» with the `Artifact` tool
   (`action: "quickstart"`, `intent: "design"`), like the admin section canvas. Use only tokens and
   components from `docs/design-system.md`; every new token or component is listed in the message to
   the customer.
3. Draw the artboards below. Each screen at 393, 768 and 1200 px unless the list says otherwise; states
   are separate artboards. Texts are Russian, as in the step files.
4. Show the canvas to the customer (in Russian): the link, the list of artboards, new tokens, new icons.
   Change it until the customer says yes.
5. Fill in «Approved values» at the end of this file — the next steps read the values from there, not
   from the canvas. Set step 0 to `done` in the stage README, add the canvas link to its «Design»
   section; open a PR with these docs only.

## Artboards

**A. Task cards** (one artboard per width) — the line `TaskMeta` under the name in the three cards:
the project task row (`ProjectTask`), the «Мои задачи» card, the kanban card. Its items, left to right:
priority icon (only `low`, `high`, `urgent`), due date chip («30 окт»; «Сегодня», «Завтра»; overdue — in
`--text-critical`), subtasks «2/5» with an icon, labels as colored chips (at most 3, then «+2»).
A card without any of them has no meta line. Show a card with everything and a card with nothing.

**B. Task page** — 393, 768, 1200 and the kanban task modal (`TaskModal`, 880 px wide):
- field rows (`TaskField`): «Ответственный», «Проект», «Приоритет», «Срок», «Метки» (chips inside the
  row, «Добавить» when empty);
- for a subtask, above the name: «Подзадача DS-12 · Название родителя» as a link;
- the «Подзадачи» block: progress «2 из 5», rows (status badge, key, name, avatar), «Добавить подзадачу»
  (an inline field for a name), an empty state;
- the «Вложения» block: rows with an image preview or a file icon, name, size «2,4 МБ», author, date,
  a «…» menu («Скачать», «Удалить»), the button «Добавить файл», an upload in progress, an empty state;
- the feed with new events (texts in steps 2, 4, 9) and a comment with a mention «@Анна Петрова».
- An archived task: rows not clickable, no «Добавить…» buttons.

**C. Pickers** (bottom sheet on 393, dialog on 768/1200):
- «Приоритет» — four radio rows with icons, like the status picker;
- «Срок» — a native date field, «Убрать срок» (text button), «Применить»;
- «Метки» — a search field, checkbox rows with color chips, the row «Создать метку «…»» when nothing
  matches, the color choice of a new label (8 swatches); the limit «Не больше 10 меток» state;
- «Сделать подзадачей» — a search field and project tasks (key + name) to choose the parent.

**D. New task form** — the «Приоритет» and «Срок» selection fields under «Проект».

**E. Project labels** — a modal «Метки проекта» opened from the project menu: rows (chip, name, «…» with
«Изменить», «Удалить»), the edit state (name field + 8 swatches), «Новая метка», the delete confirmation
«Удалить метку «…»? Она пропадёт у всех задач проекта.», the view of a member (no «…»), an empty state.

**F. Notifications**:
- the bell: a `Drawer` item «Уведомления» with an unread counter badge (expanded and collapsed drawer);
  on a phone — a round button next to search in `BottomNavBar` with a dot/counter;
- the page «Уведомления»: rows (actor avatar, text, task key and name, time, unread dot), «Прочитать
  все», an empty state «Уведомлений пока нет», loading;
- row texts for each kind (step 14), a row of an overdue reminder;
- the profile: the switch «Письма об уведомлениях» with the hint for disabled mail
  «Почта не подключена администратором — письма не приходят».

**G. Mentions** — the comment field with the member suggestion list after «@», the inserted «@Анна
Петрова», a comment showing the mention.

**H. Sorting** — the sort modal with the new options «По приоритету» and «По сроку».

**I. New tokens and icons** — one artboard:
- label palette: 8 colors (`gray`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`), each a
  background and a text color with enough contrast;
- priority colors: `urgent` and `high` icon colors, `low` icon color;
- the counter badge color;
- icons, 24×24 in the style of `web/src/assets/icons/`: priority (flag or bars, one per level if they
  differ), calendar, label (tag), subtasks, paperclip, file, download, bell.

## Approved values

The customer approved the canvas on 2026-10-23.

- **Canvas link:** [«TaskTrail — этап 3»](https://claude.ai/artifact/HxcqoKqupKL65NSs5nTPMC). Artboard titles
  start with the letter of the list above («B. Страница задачи — 1200», «C. Метки — окно»…); the entry
  artboard is the task page at 1200.
- **Label tokens** `--label-<color>-bg` / `--label-<color>-text` (text contrast on its background):

  | Color | `-bg` | `-text` | Contrast |
  | --- | --- | --- | --- |
  | `gray` | `rgba(235, 235, 235, 1)` | `rgba(74, 74, 74, 1)` | 7.4 |
  | `red` | `rgba(255, 224, 221, 1)` | `rgba(179, 38, 30, 1)` | 5.3 |
  | `orange` | `rgba(255, 230, 207, 1)` | `rgba(160, 74, 0, 1)` | 5.0 |
  | `yellow` | `rgba(252, 240, 191, 1)` | `rgba(115, 86, 0, 1)` | 6.0 |
  | `green` | `rgba(217, 242, 223, 1)` | `rgba(30, 112, 52, 1)` | 5.2 |
  | `teal` | `rgba(211, 240, 238, 1)` | `rgba(15, 107, 100, 1)` | 5.3 |
  | `blue` | `rgba(223, 235, 255, 1)` | `rgba(44, 89, 184, 1)` | 5.4 |
  | `purple` | `rgba(236, 228, 255, 1)` | `rgba(106, 61, 192, 1)` | 5.6 |

  `LabelChip`: `caption-med`, height 20, padding `2px 8px`, radius 8. `ColorSwatches`: the selected
  swatch has `outline: 2px solid var(--border-accent); outline-offset: 2px`.
- **Priority icon colors:** `--priority-urgent: rgba(255, 50, 50, 1)` (the value of `--icon-critical`),
  `--priority-high: rgba(200, 100, 0, 1)` (3.5:1 on `--bg-secondary`), `--priority-low: rgba(64, 111, 213, 1)`
  (the value of `--icon-accent`); `normal` uses `--icon-secondary`.
- **Counter badge:** no new tokens — background `--icon-accent`, text `--text-primary-contrast`
  (4.6:1); `caption-2-med` weight 600, height 18, min-width 18, padding `0 5px`, radius 9. The unread dot
  of a notification — 8 px, `--icon-accent`.
- **Icons** (`web/src/assets/icons/`, 24×24, `stroke="currentColor"`, width 1.3, round caps; paths —
  artboard I):

  | File | `ICONS` key | Shows |
  | --- | --- | --- |
  | `PriorityUrgentIcon.svg` | `priorityUrgent` | double chevron up |
  | `PriorityHighIcon.svg` | `priorityHigh` | chevron up |
  | `PriorityNormalIcon.svg` | `priorityNormal` | two horizontal bars |
  | `PriorityLowIcon.svg` | `priorityLow` | chevron down |
  | `CalendarIcon.svg` | `calendar` | calendar: due date |
  | `LabelIcon.svg` | `label` | tag: labels |
  | `SubtasksIcon.svg` | `subtasks` | a stem with two boxes: subtasks |
  | `PaperclipIcon.svg` | `paperclip` | paperclip: «Добавить файл» |
  | `FileIcon.svg` | `file` | a page with a folded corner: a non-image attachment |
  | `DownloadIcon.svg` | `download` | arrow down to a line: «Скачать» |
  | `BellIcon.svg` | `bell` | bell: notifications |

  There is no separate `ICONS.priority`: step 2 uses the level icons (see the first deviation).
- **Deviations from the step files agreed with the customer:**
  1. Step 2: the «Приоритет» `TaskField` and the new task form show `PriorityIcon` of the current
     value (colored), not one generic icon — `TaskField` and `SelectionField` take an `iconNode` for it
     (step 2 describes it).
  2. Step 11: while files upload, the «Вложения» list shows a dimmed row per file (`ICONS.file`, the
     name, «Загружаем…» in `caption-reg`) in addition to the disabled «Загружаем…» button.
  3. Step 9: `SelectParentModal`'s search field has the placeholder «Ключ или название»
     (`tasksTexts.searchParent`); on 768+ it has only «Отменить» below — a tap on a row chooses.
  4. Step 6: the create form in `LabelOptions` has the caption «Цвет» (`labelColor`) above
     `ColorSwatches` and a `LabelChip` preview of the new label next to «Создать».
  5. Step 7: in `ProjectLabelsModal` the edit form (`LabelForm`) sits on a white block (radius 12,
     padding 12, `--shade-01`) inside the list.
  6. Step 14: on a phone the bell is a round 48 px link between the search button and the menu pill
     of `BottomNavBar`; on the notifications page it is white with a dark icon (like the active menu
     item). `UnreadBadge` sits on its corner with a 2 px ring of the page color; in the collapsed
     `Drawer` — on the icon corner, in the expanded one — at the right end of the item.
  7. Step 14: an unread notification row has the background `--bg-secondary-2` and the unread dot; a
     read row is transparent. The actor's name is `body-med-2`, the rest of the sentence `body-reg-2`;
     reminders show `ICONS.calendar` in a 32 px `--bg-secondary` circle (`--icon-critical` for overdue).
  8. Step 14: the empty state picture is our own — a bell in a light blue circle (artboard «F.
     Уведомлений нет — 1200»); add it to `web/src/assets/` as an SVG and use it in `EmptyListState`.

  Not a change: some artboards draw the «Ответственный» row with the person's avatar; stage 3 keeps
  that row as it is now (`ICONS.profile` and the name).

## Done when

The customer approved the canvas; «Approved values» is filled in; the stage README links the canvas;
`scripts/dev.sh rules` is green.

## Show the customer

The canvas, artboard by artboard; new tokens and icons separately.
