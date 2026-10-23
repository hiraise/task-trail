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

*(Filled in by this step after the customer's approval.)*

- Canvas link:
- Label tokens `--label-<color>-bg` / `--label-<color>-text`: 8 pairs of values.
- Priority icon colors (`--priority-urgent`, `--priority-high`, `--priority-low`):
- Counter badge: background and text tokens:
- Icons: file names and what each shows:
- Deviations from the step files agreed with the customer:

## Done when

The customer approved the canvas; «Approved values» is filled in; the stage README links the canvas;
`scripts/dev.sh rules` is green.

## Show the customer

The canvas, artboard by artboard; new tokens and icons separately.
