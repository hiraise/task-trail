# Step 1 — priority on the server

Read first: [ADR-0033](../../adr/0033-task-priority.md), [ADR-0028](../../adr/0028-task-activity-feed.md)
(events), [ADR-0002](../../adr/0002-task-edit-endpoints.md), the stage [README](README.md) — especially
«Recipe: a new task field». The web part is [step 2](02-priority-web.md). Names marked *(new)* do not
exist yet.

This step also replaces the long argument list of `entity.NewTask` with a struct `entity.TaskDraft`:
steps 3 and 8 then add a field to it instead of changing signatures again.

## Migration `000010_task_priority`

```sql
-- up
-- Task priority (ADR-0033): a fixed set, existing tasks get normal.
ALTER TABLE tasks ADD COLUMN priority VARCHAR NOT NULL DEFAULT 'normal';
-- down
ALTER TABLE tasks DROP COLUMN priority;
```

## Domain

- `server/internal/domain/entity/task_priority.go` *(new)*, by the pattern of `task_status.go`:

  ```go
  // TaskPriority — a task priority (ADR-0033). The set is fixed; IDs are permanent, names live in the web.
  type TaskPriority string

  const (
      PriorityLow    TaskPriority = "low"
      PriorityNormal TaskPriority = "normal"
      PriorityHigh   TaskPriority = "high"
      PriorityUrgent TaskPriority = "urgent"
  )

  // Valid — the priority is in the set.
  func (p TaskPriority) Valid() bool { … switch over the four constants … }
  ```

- `entity.TaskDraft` *(new)* in `entity/task.go` — what a new task is made of:

  ```go
  // TaskDraft — the fields a new task is created with. An empty Priority means PriorityNormal.
  type TaskDraft struct {
      Name        string
      Description *string
      Status      TaskStatus
      Priority    TaskPriority
  }
  ```

- `Task.Priority TaskPriority` *(new)* — after `Status`.
- `NewTask(id, projectID, projectKey, number, authorID, draft TaskDraft, assignee, now)` — replaces the
  arguments `name, description, status`; sets `Priority` to `draft.Priority` or `PriorityNormal` when it
  is empty.
- `Task.ChangePriority(priority TaskPriority, now time.Time)` *(new)* — like `ChangeStatus`.
- `factory.TaskFactory.New(author, projectKey, number, draft entity.TaskDraft, assignee)` — passes
  the draft on.
- Event kind `EventPriorityChanged TaskEventKind = "priority_changed"` *(new)* in `entity/task_event.go`;
  `TaskEvent` gets `FromPriority, ToPriority *TaskPriority` (update the type comment: which kind sets
  which fields).
- `TaskEventFactory.PriorityChanged(taskID, actorID, from, to entity.TaskPriority, now)` *(new)* in
  `factory/task_event.go`, like `StatusChanged`.

## Repositories

`server/internal/infrastructure/repository/persistent/task.go`:

- `Create`: `"priority": t.Priority`.
- `taskColumns`: add `t.priority` right after `t.status`.
- `scanTask`: a `var priority string` scanned right after `&status`; then
  `t.Priority = entity.TaskPriority(priority)`.
- `Update`: `priority = $10` in `SET` (append the argument `t.Priority` at the end — keep the existing
  numbering).

`persistent/task_event.go`: `taskEventData` gets
`FromPriority *entity.TaskPriority \`json:"fromPriority,omitempty"\`` and `ToPriority …`; copy them in
`Create` and back in `ListByTask`.

Repository test: in `persistent/task_test.go` (`TestTaskRepository`) create a task with
`PriorityHigh`, read it back, change to `PriorityUrgent` with `Update`, read again. In
`persistent/activity_test.go` write a `priority_changed` event and read `FromPriority`/`ToPriority` back.

## Application

- `dto.CreateTask` (`application/dto/task.go`) gets `Priority entity.TaskPriority`.
- `CreateTaskService.Execute` (`service/task/tasks.go`) builds
  `entity.TaskDraft{Name: data.Name, Description: data.Description, Status: data.Status, Priority: data.Priority}`
  for `s.factory.New`.
- `ChangePriorityService` *(new)* in `service/task/tasks.go` — copy `ChangeStatusService`:

  ```go
  // ChangePriorityService changes the priority; the same value writes no event (ADR-0033).
  type ChangePriorityService struct{ editor *editor }

  func (s *ChangePriorityService) Execute(ctx context.Context, userID, taskID string, priority entity.TaskPriority) (*entity.Task, error) {
      e := s.editor
      return e.edit(ctx, userID, taskID, nil, func(_ context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
          from := task.Priority
          if from == priority {
              return nil, nil
          }
          task.ChangePriority(priority, now)
          return []*entity.TaskEvent{e.newEvent.PriorityChanged(task.ID, entity.UserID(userID), from, priority, now)}, nil
      })
  }
  ```

  Add `ChangePriority *ChangePriorityService` to `TaskModule` and `ChangePriority: &ChangePriorityService{editor: e}`
  in `New` (`service/task/task.go`).
- Fix every caller and test that calls `entity.NewTask` or `TaskFactory.New` (`go vet ./...` lists them):
  `entity/task_test.go`, `persistent/task_test.go` (`newTask`), `service/task/task_test.go`
  (`TestCreateTask` expectations). Keyed `entity.Task{…}` literals need no change.
- `TestCreateTask` in `service/task/task_test.go`: check that a draft without priority gives `normal`.

## Contract

- Schema `TaskPriority` *(new)*: `type: string`, `enum: [low, normal, high, urgent]`, description:
  "Fixed set from the lowest (ADR-0033); display names live in the web".
- `Task.priority: { $ref: TaskPriority }` — add `priority` to `required`.
- `CreateTaskRequest.priority` — optional `$ref: TaskPriority`, description "absent — `normal`".
- Path `/v1/tasks/{taskId}/priority` *(new)*, `patch`, `operationId: changeTaskPriority`, copy
  `changeTaskStatus`: request `ChangeTaskPriorityRequest { priority }` (required), responses `200 Task`,
  `401`, `404`, `409 TaskReadOnly`, `422 ValidationFailed`, `500`.
- `TaskEventKind`: add `priority_changed`; extend its description.
- `TaskEvent`: `fromPriority` and `toPriority` as `oneOf: [{ $ref: TaskPriority }, { type: "null" }]`,
  both in `required`; the schema description says `priority_changed` uses them.

## HTTP

- `request/task.go`:
  - `createTaskReq.Priority *string \`json:"priority" binding:"omitnil,taskpriority"\``;
    `BindCreateTask` sets `Priority: entity.TaskPriority(*body.Priority)` when it is set,
    otherwise `entity.PriorityNormal`;
  - `changeTaskPriorityReq { Priority string \`json:"priority" binding:"required,taskpriority"\` }` and
    `BindChangeTaskPriority(c) (entity.TaskPriority, error)` *(new)*, like `BindChangeTaskStatus`;
  - `func taskPriority(fl validator.FieldLevel) bool { return entity.TaskPriority(fl.Field().String()).Valid() }`.
- `request/validators.go`: register `taskpriority` in `RegisterValidators` and list it in the comment.
- `response/task.go`: `Task.Priority string \`json:"priority"\``, filled in `NewTask`.
- `response/activity.go`: `TaskEvent.FromPriority, ToPriority *string` (`json:"fromPriority"`,
  `json:"toPriority"`), filled like `FromStatusID`.
- `v1/task.go`: `changePriority` handler (copy `changeStatus`), route
  `g.PATCH("/tasks/:taskId/priority", r.changePriority)` in `NewTaskRouter`.

## Handler tests

In `v1/task_test.go` add `Priority string \`json:"priority"\`` to `task`; in `v1/activity_test.go` add
`FromPriority`, `ToPriority *string` to `taskEvent` and a `case` in `describe()` printing
`from→to`. New tests (copy the style of `TestCreateTaskInStatus`):

- `TestTaskPriority`: a task without `priority` is `normal`; created with `"priority": "high"` is `high`;
  `PATCH …/priority` to `urgent` → `200`, `priority` is `urgent`; `requireEvents` shows
  `priority_changed … high→urgent` newest first; the same value again → `200` and no new event.
- Validation (`TestTaskValidation` table): `{"priority": "top"}` and `{}` on `PATCH …/priority` → `422`
  with `details.priority`; `"priority": "top"` on create → `422` with `details.priority`.
- Access: a non-member → `404`; an archived task → `409 TASK_ARCHIVED`; a task of an archived project →
  `409 PROJECT_ARCHIVED` (copy the setup of `archive_test.go`).

## Web types

Run `npm run api:types` in `web/`. If `npm run build` or `npm run test:run` now fails because a test
fixture typed with generated types misses `priority`, `fromPriority` or `toPriority` (for example the
`dto` objects in `web/src/infrastructure/repositories/mappers.test.ts`), add the fields to the fixture
(`priority: "normal"`, `fromPriority: null`, `toPriority: null`). Do not map them yet — step 2 does.

## Stack

`scripts/stand-smoke.mjs`, after the archive checks: `PATCH /v1/tasks/{id}/priority` with `urgent` as the
member → `200` and `priority === "urgent"`; `GET …/events` — the newest kind is `priority_changed`.

## Docs

`server/README.md` — nothing (no new variable). The root README is updated at the end of the stage.

## Done when

Common criteria from the stage README; step 1 is `done` and step 2 is `next` in the stage README.

## Show the customer

In the stack's Swagger (`/api/docs/`): a task with `priority`, `PATCH /v1/tasks/{taskId}/priority`,
the `priority_changed` event, `422` for an unknown priority; the new tests and the
`scripts/dev.sh check` output.
