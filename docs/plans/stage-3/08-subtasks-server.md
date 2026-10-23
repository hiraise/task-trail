# Step 8 — subtasks on the server

Read first: [ADR-0036](../../adr/0036-subtasks.md), [ADR-0028](../../adr/0028-task-activity-feed.md),
[ADR-0026](../../adr/0026-project-and-task-keys.md), the stage [README](README.md) — «Recipe: a new task
field». Steps 1, 3 and 5 are merged: `TaskDraft`, the labels column at the end of `taskColumns`. The web
part is [step 9](09-subtasks-web.md). Names marked *(new)* do not exist yet.

## Migration `000013_subtasks`

```sql
-- up
-- A subtask is a task with a parent in the same project, one level deep (ADR-0036).
ALTER TABLE tasks ADD COLUMN parent_id UUID REFERENCES tasks(id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id) WHERE deleted_at IS NULL;
-- down
DROP INDEX idx_tasks_parent_id;
ALTER TABLE tasks DROP COLUMN parent_id;
```

## Domain

`entity/task.go`:

- `Task.ParentID *TaskID` *(new)*; `Task.SubtasksTotal`, `Task.SubtasksDone int` *(new)* — read-only,
  filled by repositories: non-deleted, non-archived subtasks, and those of them in a resolved status.
- No `TaskDraft.ParentID`: a parent is set only through `AttachTo`, which checks the rules.
- `(*Task).AttachTo(parent *Task, hasSubtasks bool, now time.Time) error` *(new)* — checks the rules
  and sets `ParentID` and `UpdatedAt`:

  ```go
  // AttachTo makes the task a subtask of parent (ADR-0036): one level, the same project, not itself.
  // hasSubtasks — whether the task has subtasks of its own. An archived parent — TASK_ARCHIVED.
  func (t *Task) AttachTo(parent *Task, hasSubtasks bool, now time.Time) error {
      switch {
      case parent.ID == t.ID, parent.ProjectID != t.ProjectID, parent.ParentID != nil, hasSubtasks:
          return domain.ErrTaskParentInvalid("taskID", t.ID, "parentID", parent.ID)
      }
      if err := parent.RequireActive(); err != nil {
          return err
      }
      id := parent.ID
      t.ParentID = &id
      t.UpdatedAt = now
      return nil
  }
  ```

- `(*Task).Detach(now time.Time)` *(new)* — `ParentID = nil`, `UpdatedAt = now`.
- Error `TaskParentInvalid` `"TASK_PARENT_INVALID"` → `422`, six places; Russian text «Подзадачей может
  быть задача того же проекта без своих подзадач, а родитель — не подзадача».
- Event `EventParentChanged "parent_changed"`; `TaskEventFactory.ParentChanged(taskID, actorID, from,
  to *string, now)` *(new)* — sets `FromKey`/`ToKey` (the keys of the old and the new parent).
- Tests in `entity/task_test.go`: each broken rule of `AttachTo` gives `TASK_PARENT_INVALID`, an archived
  parent gives `TASK_ARCHIVED`, a valid one sets `ParentID`.

## Repositories

`persistent/task.go`:

- `Create`: `"parent_id": t.ParentID`; `Update`: `parent_id = $12` (argument `t.ParentID`).
- `taskColumns`: after `t.due_date` add `t.parent_id` and two counters; the labels column stays **last**:

  ```sql
  t.parent_id,
  (SELECT count(*) FROM tasks s WHERE s.parent_id = t.id AND s.deleted_at IS NULL AND s.archived_at IS NULL),
  (SELECT count(*) FROM tasks s WHERE s.parent_id = t.id AND s.deleted_at IS NULL AND s.archived_at IS NULL
      AND s.status = 'done'),
  ```

  Comment the `'done'`: "entity.StatusDone — the only resolved status (ADR-0003)".
- `scanTask`: `var parentID *string` and `&t.SubtasksTotal`, `&t.SubtasksDone` in the same positions.
- New methods of `TaskRepository` (`domain/repository/task.go`, regenerate `test/mocks/mock_task.go`):

  ```go
  // ListSubtasks — subtasks of the task, archived ones included, by number.
  ListSubtasks(ctx context.Context, parentID entity.TaskID) ([]*entity.Task, error)
  // HasSubtasks — whether the task has non-deleted subtasks, archived ones included.
  HasSubtasks(ctx context.Context, id entity.TaskID) (bool, error)
  // DetachSubtasks clears the parent of the task's subtasks and returns their IDs: each gets a
  // parent_changed event (ADR-0036).
  DetachSubtasks(ctx context.Context, parentID entity.TaskID, now time.Time) ([]entity.TaskID, error)
  ```

  `DetachSubtasks` — copy `UnassignInProject`:
  `UPDATE tasks SET parent_id = NULL, updated_at = $2 WHERE parent_id = $1 AND deleted_at IS NULL RETURNING id`.
- Repository tests: a parent's counters (two subtasks, one done, an archived third not counted);
  `ListSubtasks` order and archived included; `DetachSubtasks` returns the IDs and clears `parent_id`.

## Application (`service/task/`)

- `dto.CreateTask.ParentID *string`. `CreateTaskService`, after the assignee: when `data.ParentID` is set —
  `parent, err := e.tasks.Get(ctx, entity.TaskID(*data.ParentID))`; `ENTITY_NOT_FOUND` →
  `domain.ErrTaskParentInvalid(…)` (it is request data, not the resource of the path); then, after the
  task is built by the factory, `task.AttachTo(parent, false, task.CreatedAt)`. The project is already
  locked, and a parent of another project fails `AttachTo`. Only the `created` event is written.
- `ChangeParentService` *(new)* — `editor.edit`, apply:
  1. `parentID == nil`: no parent now → no change; otherwise read the old parent (`e.tasks.Get`) for its
     key, `task.Detach(now)`, event `ParentChanged(…, &oldKey, nil, now)`.
  2. `parentID` equals `task.ParentID` → no change.
  3. Otherwise `parent := e.tasks.Get(…)` (`ENTITY_NOT_FOUND` → `TASK_PARENT_INVALID`),
     `has, err := e.tasks.HasSubtasks(ctx, task.ID)`, the old key if any, `task.AttachTo(parent, has, now)`,
     event `ParentChanged(…, oldKey, &newKey, now)` with `parent.Key()`.
- `ListSubtasksService` *(new)* — `feed.task(ctx, userID, taskID)` (membership), then `ListSubtasks`.
- `MoveTaskService` apply, after `task.MoveTo(…)` and the labels cleanup:
  - the task was a subtask: read the old parent's key, `task.Detach(now)`, event
    `ParentChanged(task.ID, actor, &parentKey, nil, now)` after `moved` and `assignee_changed`;
  - its own subtasks: `ids, err := e.tasks.DetachSubtasks(ctx, task.ID, now)`, an event
    `ParentChanged(id, actor, &fromKey, nil, now)` for each, where `fromKey` is the task's key before
    the move.
- `DeleteTaskService`: before `SoftDelete` — `DetachSubtasks` and the same events (`fromKey` —
  `task.Key()`), recorded with `e.record`.
- Register `ChangeParent` and `ListSubtasks` in `TaskModule`/`New`; update gomock expectations in
  `task_test.go` (`TestMoveTask` now expects `DetachSubtasks`; the delete tests too).

## Contract

- `Task`: `parentId` (`[string, "null"]`, uuid, "the parent task (ADR-0036)"), `subtasksTotal` and
  `subtasksDone` (`integer`, `minimum: 0`, "non-archived subtasks / of them resolved") — all required.
- `CreateTaskRequest.parentId` — optional uuid, "the parent in the same project".
- `/v1/tasks/{taskId}/parent` *(new)*: `patch` `changeTaskParent`, `ChangeTaskParentRequest { parentId }`
  required, `[string, "null"]` uuid; responses `200 Task`, 401, 404, `409 TaskReadOnly` (and
  `TASK_ARCHIVED` of the parent), `422` `TASK_PARENT_INVALID` or `VALIDATION_FAILED`, 500.
- `/v1/tasks/{taskId}/subtasks` *(new)*: `get` `listSubtasks` — `200 Task[]`, 401, 404, 500.
- `createTask`: its `422` is `$ref: AssigneeInvalid` and its `409` is `$ref: ProjectArchived`, both shared
  with other operations — do not edit them; replace the two `$ref`s of `createTask` with inline
  responses: `409` — "`PROJECT_ARCHIVED` — the project is archived; `TASK_ARCHIVED` — the parent is
  archived", `422` — "`ASSIGNEE_NOT_MEMBER`, `TASK_PARENT_INVALID` or `VALIDATION_FAILED`".
- `TaskEventKind`: `parent_changed`; `TaskEvent` description: `parent_changed` uses `fromKey`/`toKey` —
  the parent keys, `null` — no parent.
- `ErrorCode`: `TASK_PARENT_INVALID`.

## HTTP

- `request/task.go`: `createTaskReq.ParentID *string \`json:"parentId" binding:"omitnil,uuid"\`` (+
  `normalizeID(r.ParentID)` in its `normalize()`);
  `changeTaskParentReq { ParentID Optional[string] \`json:"parentId" binding:"omitnil,uuid"\` }` with
  `func (r *changeTaskParentReq) normalize() { normalizeID(r.ParentID.Value) }` (an upper-case UUID must
  compare equal to the stored one) and a struct check `requireParent` (copy `requireAssignee`),
  registered with `v.RegisterStructValidation(requireParent, changeTaskParentReq{})` in
  `RegisterValidators`; `BindChangeTaskParent(c) (*string, error)`.
- `response/task.go`: `ParentID *string \`json:"parentId"\``, `SubtasksTotal int \`json:"subtasksTotal"\``,
  `SubtasksDone int \`json:"subtasksDone"\``.
- `v1/task.go`: `changeParent` and `listSubtasks` handlers; routes
  `g.PATCH("/tasks/:taskId/parent", …)`, `g.GET("/tasks/:taskId/subtasks", …)`.

## Handler tests — `v1/subtask_test.go` *(new)*

Add `ParentID *string`, `SubtasksTotal`, `SubtasksDone int` to `task`. Helper
`createSubtask(t, s, projectID, parentID, name) task`.

- Create with `parentId` → `parentId` set; the parent shows `subtasksTotal 1`, `subtasksDone 0`; the
  subtask moved to `done` → `subtasksDone 1`; the subtask archived → `subtasksTotal 0`.
- `GET …/subtasks` — by number, archived included; a non-member → `404`.
- `TASK_PARENT_INVALID`: a subtask of a subtask; a parent of another project; the task itself; a task
  with subtasks attached to another; an unknown `parentId` on create and on `PATCH`.
- An archived parent → `409 TASK_ARCHIVED` on create and on `PATCH`.
- `PATCH …/parent` attach → event `parent_changed -→<parent key>`; detach with `null` → `<parent key>→-`;
  the same value → no event. Project keys in tests are random (`projectkey.New()`): build the expected
  strings from the `key` of the parent in its response.
- Move a subtask to another project → `parentId null`, events `moved`, `parent_changed`; move a parent →
  its subtask has `parentId null` and `parent_changed <old parent key>→-`, the parent's `subtasksTotal`
  is 0.
- Delete a parent → the subtask still exists with `parentId null` and the event.

## Web types

`npm run api:types`; fixtures get `parentId: null`, `subtasksTotal: 0`, `subtasksDone: 0`;
`TASK_PARENT_INVALID` in `ApiErrorCode` and `apiErrorTexts`.

## Stack

Smoke: create a subtask of the smoke task, the parent's `subtasksTotal === 1`, `GET …/subtasks` returns it;
delete the subtask.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: creating a subtask, the parent's counters, `GET …/subtasks`, `PATCH …/parent`, the one-level
rule (`422`), what happens on a move and a delete; the tests and the `scripts/dev.sh check` output.
