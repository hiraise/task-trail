# Step 3 — due date on the server

Read first: [ADR-0034](../../adr/0034-task-due-date.md), [ADR-0028](../../adr/0028-task-activity-feed.md),
the stage [README](README.md) — «Recipe: a new task field». Step 1 is the closest example: this step
repeats it for a nullable date. The web part is [step 4](04-due-date-web.md). Names marked *(new)* do not
exist yet.

## Migration `000011_task_due_date`

```sql
-- up
-- Optional due date of a task: a calendar day without time (ADR-0034).
ALTER TABLE tasks ADD COLUMN due_date DATE;
-- down
ALTER TABLE tasks DROP COLUMN due_date;
```

## Domain

`entity/task.go`:

- `Task.DueDate *time.Time` *(new)* — after `Priority`; comment: "a calendar day at 00:00 UTC
  (ADR-0034); nil — no due date".
- `TaskDraft.DueDate *time.Time` *(new)*; `NewTask` copies it.
- `Task.SetDueDate(date *time.Time, now time.Time)` *(new)* — sets the field and `UpdatedAt`.
- `NewDueDate(year int, month time.Month, day int) time.Time` *(new)* — `time.Date(y, m, d, 0, 0, 0, 0, time.UTC)`.
- `ParseDueDate(s string) (time.Time, error)` *(new)* — `time.Parse(time.DateOnly, s)` (the result is
  UTC midnight).
- `FormatDueDate(t time.Time) string` *(new)* — `t.UTC().Format(time.DateOnly)`.
- `SameDueDate(a, b *time.Time) bool` *(new)* — both nil, or both set and the same `FormatDueDate`.

Event: `EventDueDateChanged TaskEventKind = "due_date_changed"`; `TaskEvent.FromDueDate, ToDueDate *string`
(already formatted `YYYY-MM-DD`, nil — no date); `TaskEventFactory.DueDateChanged(taskID, actorID,
from, to *time.Time, now)` *(new)* formats both with `FormatDueDate`.

Test in `entity/task_test.go`: `ParseDueDate("2026-10-30")` round-trips through `FormatDueDate`;
`ParseDueDate("2026-02-30")` fails; `SameDueDate` for nil/nil, nil/date, two equal dates.

## Repositories

`persistent/task.go` (the recipe):

- `Create`: `"due_date": t.DueDate`.
- `taskColumns`: `t.due_date` right after `t.priority`; `scanTask`: `&t.DueDate` in the same position.
  pgx scans `DATE` into `*time.Time` at UTC midnight; normalize with
  `if t.DueDate != nil { d := t.DueDate.UTC(); t.DueDate = &d }`.
- `Update`: `due_date = $11`, argument `t.DueDate`.

`persistent/task_event.go`: `taskEventData.FromDueDate`, `ToDueDate *string` (`json:"fromDueDate,omitempty"`, …).

Repository test: a task with a due date `2026-10-30` reads back with the same `FormatDueDate`; `Update`
to nil clears it.

## Application

- `dto.CreateTask.DueDate *time.Time`; `CreateTaskService` puts it in the draft.
- `ChangeDueDateService` *(new)* in `service/task/tasks.go` — copy `ChangePriorityService`; nil removes
  the date; compare with `entity.SameDueDate`; event `e.newEvent.DueDateChanged(…, from, date, now)`.
  Register `ChangeDueDate` in `TaskModule` and `New`.

## Contract

- `Task.dueDate: { type: [string, "null"], format: date, description: "A calendar day (ADR-0034); null — no due date" }`,
  in `required`.
- `CreateTaskRequest.dueDate: { type: [string, "null"], format: date }` — optional.
- Path `/v1/tasks/{taskId}/due-date` *(new)*, `patch`, `operationId: changeTaskDueDate`, request
  `ChangeTaskDueDateRequest { dueDate }` — `required: [dueDate]`, `type: [string, "null"]`,
  `format: date`; responses as in `changeTaskPriority`.
- `TaskEventKind`: `due_date_changed`; `TaskEvent.fromDueDate`, `toDueDate`:
  `{ type: [string, "null"], format: date }`, both required; the description lists them.

## HTTP

- `request/task.go`:
  - `createTaskReq.DueDate *string \`json:"dueDate" binding:"omitnil,datetime=2006-01-02"\``;
    `BindCreateTask` parses it with `entity.ParseDueDate` (the validator already checked the format;
    `datetime` also rejects `2026-02-30`).
  - `changeTaskDueDateReq { DueDate Optional[string] \`json:"dueDate" binding:"omitnil,datetime=2006-01-02"\` }`
    and a struct check `requireDueDate` (copy `requireAssignee`): the field must be present, `null`
    allowed. Register it in `RegisterValidators`.
  - `BindChangeTaskDueDate(c) (*time.Time, error)` *(new)* — nil for `null`.
- `middleware/error.go` `messageForTag`: `case "datetime": return "нужна дата ГГГГ-ММ-ДД"`.
- `response/task.go`: `Task.DueDate *string \`json:"dueDate"\`` — `entity.FormatDueDate` when set.
- `response/activity.go`: `TaskEvent.FromDueDate`, `ToDueDate *string`.
- `v1/task.go`: `changeDueDate` handler and route `g.PATCH("/tasks/:taskId/due-date", r.changeDueDate)`.

## Handler tests

Add `DueDate *string` to `task` and `FromDueDate`, `ToDueDate` to `taskEvent` (+ a `describe()` case).
`TestTaskDueDate` *(new)*:

- created without `dueDate` → `null`; with `"2026-10-30"` → `"2026-10-30"`;
- `PATCH …/due-date` `{"dueDate": "2026-11-02"}` → `200`, event `due_date_changed 2026-10-30→2026-11-02`;
- `{"dueDate": null}` → `null`, event `…2026-11-02→-`; `null` again → no new event;
- a past date (`2020-01-01`) is accepted.

Validation table: `{}` → `422` `details.dueDate` «обязательное поле»; `"30.10.2026"`, `"2026-02-30"`,
`"2026-10-30T00:00:00Z"` → `422` `details.dueDate`. Access and archive — as in step 1.

## Web types

`npm run api:types`; add `dueDate: null`, `fromDueDate: null`, `toDueDate: null` to generated-type
fixtures if the build asks for them.

## Stack

Smoke: `PATCH …/due-date` with the date of tomorrow (`new Date(Date.now() + 864e5).toISOString().slice(0, 10)`)
→ the same `dueDate` back; the newest event is `due_date_changed`.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: `dueDate` in a task, `PATCH /v1/tasks/{taskId}/due-date` with a date and with `null`, the event,
`422` for `30.10.2026`; the tests and the `scripts/dev.sh check` output.
