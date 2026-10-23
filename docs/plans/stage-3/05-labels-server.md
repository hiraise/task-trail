# Step 5 — labels on the server

Read first: [ADR-0035](../../adr/0035-project-labels.md), [ADR-0027](../../adr/0027-reversible-archive.md)
(archived projects are read-only), [ADR-0003](../../adr/0003-fixed-roles-and-statuses.md), the stage
[README](README.md). The web parts are [step 6](06-task-labels-web.md) and [step 7](07-project-labels-web.md).
Names marked *(new)* do not exist yet. This is the biggest server step of the stage: if the session runs
long, finish labels of a project (everything except «Task labels») as a working part and leave a
`## Progress` section (ADR-0032).

## Migration `000012_labels`

```sql
-- up
-- Labels of a project (ADR-0035): any member creates them, the owner and admins manage them.
CREATE TABLE labels (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(30) NOT NULL,
    color VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
-- A name is unique in its project ignoring case.
CREATE UNIQUE INDEX uq_labels_project_name ON labels(project_id, lower(name));

-- Labels of a task, at most 10, all of the task's project. Deleting a label removes its links.
CREATE TABLE task_labels (
    task_id UUID NOT NULL REFERENCES tasks(id),
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);
-- down
DROP TABLE task_labels;
DROP TABLE labels;
```

## Domain

- `entity/label.go` *(new)*:
  - `type LabelID string`; `type LabelColor string` with constants `LabelGray "gray"`, `LabelRed "red"`,
    `LabelOrange "orange"`, `LabelYellow "yellow"`, `LabelGreen "green"`, `LabelTeal "teal"`,
    `LabelBlue "blue"`, `LabelPurple "purple"` and `func (c LabelColor) Valid() bool`;
  - `const MaxTaskLabels = 10`;
  - `type Label struct { ID LabelID; ProjectID ProjectID; Name string; Color LabelColor; CreatedAt, UpdatedAt time.Time }`;
  - `NewLabel(id, projectID, name, color, now) *Label`; `(*Label).Rename(name, now)`, `(*Label).Recolor(color, now)`.
- `entity/task.go`: `Task.Labels []Label` — comment "read-only, repositories fill it from task_labels,
  ordered by name (ADR-0035)"; `Task.SetLabels(labels []Label, now time.Time)` — sorts a copy by
  `strings.ToLower(Name)` then `ID`, sets `Labels` and `UpdatedAt`.
- `factory/label.go` *(new)*: `LabelFactory` with `idGenerator` and `clock`, `New(projectID, name, color) *entity.Label`.
- Errors (six places, stage README):
  - `LabelNameTaken` `"LABEL_NAME_TAKEN"` → `409`, message "the label name is taken in the project",
    Russian text «Метка с таким названием уже есть в проекте»; constructor with a cause, like
    `ErrProjectKeyTaken(sourceErr error, data ...any)`;
  - `LabelUnavailable` `"LABEL_UNAVAILABLE"` → `422`, message "a label is not of the task's project",
    Russian text «Метка не найдена в проекте задачи — обновите страницу».

## Repositories

`domain/repository/label.go` *(new)* — add it to `mock` in `server/Makefile`, generate
`test/mocks/mock_label.go`:

```go
// LabelRepository — labels of projects (ADR-0035) and their links to tasks.
type LabelRepository interface {
    // Create and Update return LABEL_NAME_TAKEN when the name is taken in the project ignoring case.
    Create(ctx context.Context, l *entity.Label) error
    Update(ctx context.Context, l *entity.Label) error
    // Get — the label of the project; another project's label is ENTITY_NOT_FOUND.
    Get(ctx context.Context, projectID entity.ProjectID, id entity.LabelID) (*entity.Label, error)
    // ListInProject — ordered by name ignoring case, then ID.
    ListInProject(ctx context.Context, projectID entity.ProjectID) ([]*entity.Label, error)
    // ListByIDs — those of ids that are labels of the project, in any order.
    ListByIDs(ctx context.Context, projectID entity.ProjectID, ids []entity.LabelID) ([]*entity.Label, error)
    // Delete erases the label and its links to tasks.
    Delete(ctx context.Context, id entity.LabelID) error
    // ReplaceForTask makes ids the task's labels; ClearTask removes them all.
    ReplaceForTask(ctx context.Context, taskID entity.TaskID, ids []entity.LabelID) error
    ClearTask(ctx context.Context, taskID entity.TaskID) error
}
```

`persistent/label.go` *(new)*, `PGLabelRepository` + `NewLabelRepo(pool)`:

- `Create` — `r.insert(ctx, "labels", …)`; `nameTaken(err, l)` like `keyTaken` in `persistent/project.go`
  with `const uqLabelsProjectName = "uq_labels_project_name"`.
- `Update` — `UPDATE labels SET name = $2, color = $3, updated_at = $4 WHERE id = $1`, the same
  `nameTaken`; no rows → `domain.ErrEntityNotFound(2, nil, "labelID", l.ID)`.
- `ListInProject` — `ORDER BY lower(name), id`; `ListByIDs` — `WHERE project_id = $1 AND id = ANY($2::uuid[])`.
- `ReplaceForTask` — `DELETE FROM task_labels WHERE task_id = $1`, then
  `INSERT INTO task_labels (task_id, label_id) SELECT $1, unnest($2::uuid[])` when `ids` is not empty
  (copy `addProjects` in `persistent/board.go`); both run in the caller's transaction (`r.getDb(ctx)`).

Task labels in every task response — `persistent/task.go`:

- append to `taskColumns`, as the **last** column:

  ```sql
  COALESCE((SELECT json_agg(json_build_object('id', l.id, 'projectId', l.project_id, 'name', l.name, 'color', l.color)
      ORDER BY lower(l.name), l.id)
    FROM task_labels tl JOIN labels l ON l.id = tl.label_id WHERE tl.task_id = t.id), '[]')
  ```

- `scanTask` scans it last into `var labels []byte`, then `json.Unmarshal` into
  `[]struct{ ID, ProjectID, Name, Color string }` (json tags `id`, `projectId`, `name`, `color`) and
  fills `t.Labels` (`CreatedAt`/`UpdatedAt` stay zero — they are not in task responses).
  `t.Labels` is an empty slice, not nil, for a task without labels.

Repository tests `persistent/label_test.go` *(new)*: the same name in another case → `LABEL_NAME_TAKEN`;
the same name in another project is fine; `ListInProject` order; `ReplaceForTask` then `TaskRepository.Get`
returns the labels ordered by name; `Delete` removes the label from the task; `ListByIDs` ignores another
project's label. Assert `var _ repository.LabelRepository = (*persistent.PGLabelRepository)(nil)`.

## Application

**Module `application/service/label/` *(new)***, by the pattern of `service/board/`:

- `Deps { TxManager; Clock; ProjectRepo; MemberRepo; LabelRepo; LabelFactory }`, `LabelModule { List,
  Create, Update, Delete }`, `New(d Deps)`.
- A private `lock(ctx, projectID, userID)` — `ProjectRepository.GetForUpdate`, then `MemberRepository.Get`
  (a non-member → `ENTITY_NOT_FOUND`), then `project.RequireActive()`; returns the member.
- `ListLabelsService.Execute(ctx, userID, projectID)` — `members.Get`, then `ListInProject` (no lock,
  archived projects included).
- `CreateLabelService.Execute(ctx, userID, projectID string, data dto.LabelData)` — `lock`, any member,
  `factory.New`, `Create`.
- `UpdateLabelService.Execute(ctx, userID, projectID, labelID string, changes dto.LabelChanges)` — `lock`,
  `member.RequireManager()`, `Get`, `Rename`/`Recolor` for the set fields, `Update`.
- `DeleteLabelService.Execute(ctx, userID, projectID, labelID string)` — `lock`, `RequireManager`, `Get`
  (another project's label → `404`), `Delete`.
- DTOs in `application/dto/label.go` *(new)*: `LabelData { Name string; Color entity.LabelColor }`,
  `LabelChanges { Name *string; Color *entity.LabelColor }`.
- Service tests `label_test.go` with gomock: a member updating → `FORBIDDEN`, an archived project →
  `PROJECT_ARCHIVED`, a label of another project → `ENTITY_NOT_FOUND`.

**Task module** (`service/task/`):

- `Deps.LabelRepo repository.LabelRepository`; the `editor` gets `labels repository.LabelRepository`.
- `SetLabelsService` *(new)* in `tasks.go`:

  ```go
  // SetLabelsService replaces the task's labels with labels of its project (ADR-0035); no history event.
  func (s *SetLabelsService) Execute(ctx context.Context, userID, taskID string, ids []string) (*entity.Task, error) {
      e := s.editor
      return e.edit(ctx, userID, taskID, nil, func(ctx context.Context, task *entity.Task, _ map[entity.ProjectID]*entity.Project, now time.Time) ([]*entity.TaskEvent, error) {
          labelIDs := … convert ids to []entity.LabelID …
          labels, err := e.labels.ListByIDs(ctx, task.ProjectID, labelIDs)
          if err != nil { return nil, err }
          if len(labels) != len(labelIDs) {
              return nil, domain.ErrLabelUnavailable("taskID", task.ID, "labelIDs", ids)
          }
          if err := e.labels.ReplaceForTask(ctx, task.ID, labelIDs); err != nil { return nil, err }
          task.SetLabels(… dereference labels …, now)
          return nil, nil
      })
  }
  ```

  The request already rejected duplicates, so the lengths compare exactly.
- `MoveTaskService`: after `task.MoveTo(…)`, call `e.labels.ClearTask(ctx, task.ID)` and set
  `task.Labels = []entity.Label{}` (ADR-0035: labels do not cross projects).
- `service/task/task_test.go`: `newModule` gets the label mock; `TestMoveTask` expects `ClearTask`.

**Wiring** `internal/app/app.go`: `labelRepo := persistent.NewLabelRepo(pool)`;
`labelModule := label.New(label.Deps{…, LabelFactory: factory.NewLabelFactory(idGen, clk)})`;
`LabelRepo: labelRepo` in `task.Deps`; `Server.Label`; `Label` in `v1.Modules` (`v1/router.go`) and
`NewLabelRouter(g, modules.Label, authMW, cm)`.

## Contract

- Parameter `LabelId` (path, Uuid).
- Schemas: `LabelColor` — enum of the 8 colors; `LabelName` — `string`, 1–30, description "trimmed by the
  server; unique in the project ignoring case"; `Label { id, projectId, name, color }` (all required);
  `CreateLabelRequest { name, color }` (both required); `UpdateLabelRequest { name, color }` —
  `minProperties: 1`; `SetTaskLabelsRequest { labelIds }` — array of Uuid, `maxItems: 10`,
  `uniqueItems: true`, required.
- `Task.labels` — array of `Label`, required, description "ordered by name (ADR-0035)".
- Paths, tag `projects`:
  - `/v1/projects/{projectId}/labels`: `get` `listProjectLabels` (`200 Label[]`, 401, 404, 500); `post`
    `createProjectLabel` (`201 Label`, 401, 404, `409` `LABEL_NAME_TAKEN` or `PROJECT_ARCHIVED`, 422, 500);
  - `/v1/projects/{projectId}/labels/{labelId}`: `patch` `updateProjectLabel` (`200 Label`, 401, 403, 404,
    409, 422, 500); `delete` `deleteProjectLabel` (`204`, 401, 403, 404, `409 PROJECT_ARCHIVED`, 500).
- Path `/v1/tasks/{taskId}/labels`, tag `tasks`: `put` `setTaskLabels` — `200 Task`, 401, 404,
  `409 TaskReadOnly`, `422` `LABEL_UNAVAILABLE` or `VALIDATION_FAILED`, 500.
- `ErrorCode`: `LABEL_NAME_TAKEN`, `LABEL_UNAVAILABLE`.

## HTTP

- `request/label.go` *(new)*:
  - `createLabelReq { Name string \`json:"name" binding:"required,max=30"\`; Color string \`json:"color" binding:"required,labelcolor"\` }`
    with `normalize()` — `strings.TrimSpace(r.Name)`;
  - `updateLabelReq { Name *string \`json:"name" binding:"omitnil,min=1,max=30"\`; Color *string \`json:"color" binding:"omitnil,labelcolor"\` }`,
    `normalize()` trims `Name`; a struct check `checkUpdateLabel` registered in `RegisterValidators` —
    neither field → `required_without` on `name` (copy `checkRename`). `null` for a field is treated
    as absent (the contract does not allow it, so clients do not send it);
  - `setTaskLabelsReq { LabelIDs []string \`json:"labelIds" binding:"required,max=10,unique,dive,uuid"\` }`,
    `normalize()` lower-cases each ID with `normalizeID`;
  - `BindCreateLabel`, `BindUpdateLabel`, `BindSetTaskLabels`; validator `labelcolor` registered in
    `RegisterValidators` (`entity.LabelColor(…).Valid()`).
- `response/label.go` *(new)*: `Label { ID, ProjectID, Name, Color }`, `NewLabel`, `NewLabels`.
  `response.Task.Labels []Label \`json:"labels"\`` — `make([]Label, 0, len(t.Labels))`, never nil.
- `v1/label.go` *(new)*: `labelRoutes` with `list`, `create` (`201`), `update`, `delete` (`204`), routes
  `GET/POST /projects/:projectId/labels`, `PATCH/DELETE /projects/:projectId/labels/:labelId` under
  `authMW`; `pathID` for both IDs.
- `v1/task.go`: `setLabels` handler, `g.PUT("/tasks/:taskId/labels", r.setLabels)`.

## Handler tests

`v1/label_test.go` *(new)* — `apitest.New(t, contract.Load(t))`; helpers `createLabel(t, s, projectID,
name, color) label` and `label` struct. Add `Labels []label \`json:"labels"\`` to `task` in `task_test.go`.

- `TestProjectLabels`: a member (`signUp`) creates «Баг» → `201`; the owner creates «баг» → `409
  LABEL_NAME_TAKEN`; another project may have «Баг»; the member renames → `403`; an admin renames and
  recolors → `200`; the list is ordered by name; the owner deletes → `204`, the label disappears from
  a task that had it; a non-member → `404` on every operation; in an archived project create, update,
  delete → `409 PROJECT_ARCHIVED`, list → `200`.
- Validation: name of 31 characters, an empty name, `"   "`, an unknown color, `PATCH {}` → `422` with
  the field in `details`.
- `TestTaskLabels`: set two labels → `labels` ordered by name; `[]` clears; 11 IDs → `422`
  `details.labelIds`; the same ID twice → `422`; a label of another project → `422 LABEL_UNAVAILABLE`;
  an archived task → `409`; labels come in `GET /v1/projects/{id}/tasks`, `GET /v1/users/me/tasks`,
  `GET /v1/boards/{id}/tasks` and `GET /v1/search`; a move to another project → `labels` is empty.

## Web types

`npm run api:types`; add `labels: []` to fixtures if the build asks; add `LABEL_NAME_TAKEN` and
`LABEL_UNAVAILABLE` to `ApiErrorCode` (`web/src/shared/errors/types.ts`) and their texts to
`apiErrorTexts`.

## Stack

Smoke: the member creates a label «smoke» (`blue`), sets it on the smoke task, `task.labels[0].name ===
"smoke"`; the admin (owner) deletes the label; the task has no labels.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: labels of a project — create as a member, `403` on rename by a member, `409` on a duplicate;
`PUT /v1/tasks/{taskId}/labels`; labels in task lists; the tests and the `scripts/dev.sh check` output.
