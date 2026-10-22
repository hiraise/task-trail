# Step 1 — task keys `DS-1`

Read first: [ADR-0026](../../adr/0026-project-and-task-keys.md), the stage [README](README.md).
Step 0 must be merged.

## Migration `000006_project_keys`

1. Add `projects.key VARCHAR(10)`, `projects.task_counter INT NOT NULL DEFAULT 0`, `tasks.number INT`.
2. Fill existing rows, deleted ones included:
   - project keys — `'P' || row_number() OVER (ORDER BY created_at, id)`;
   - task numbers — `row_number() OVER (PARTITION BY project_id ORDER BY created_at, id)`;
   - `task_counter` — the project's largest task number, or 0.
3. Set `NOT NULL` on `projects.key` and `tasks.number`.
4. Create unique indexes `uq_projects_key ON projects(key) WHERE deleted_at IS NULL` and
   `uq_tasks_project_number ON tasks(project_id, number)`.

## Domain

- Type `entity.ProjectKey` *(new)*.
- `Project.Key` and `Project.ChangeKey(key, now)` *(new)*.
- `Task.Number` and `Task.ProjectKey` *(new)*. `ProjectKey` is read-only: repositories fill it from
  `projects.key`. `Task.Key()` *(new)* returns `KEY-number`.
- `NewTask` and `TaskFactory.New` take the number and the project key.
- `Task.MoveTo(projectID, projectKey, number, assignee, now)` changes project, key and number.
- `ProjectFactory.New(name, description, key, ownerID)` takes the key.
- Error code `PROJECT_KEY_TAKEN` → `409` — all six places from the stage README; the Russian text:
  «Этот ключ уже занят другим проектом».

## Requests

- `createProjectReq.key` — required. Its `normalize()` trims and upper-cases the key
  (`strings.ToUpper`) before validation.
- `updateProjectReq` *(new)* replaces the shared `renameReq` for `PATCH /v1/projects/{projectId}`:
  `name`, `description` and `key` as `request.Optional[string]`. Its struct check, by the pattern of
  `checkRename`: `name: null` or `key: null` → `422`; an empty body → `422`; a body with only `key`
  is valid. `renameReq` stays for tasks.
- A custom validator tag `projectkey` *(new)* in `request/validators.go`, registered in
  `RegisterValidators` like `taskstatus`, checks the ADR pattern. Its text in `messageForTag`
  (`middleware/error.go`) is Russian — the web shows `details` texts: «2–10 букв и цифр, первая —
  буква». So a bad key gets `422` with `details.key`.

## Repositories

- `ProjectRepository.Create` and `Update` write `key`. A violation of `uq_projects_key` becomes
  `domain.ErrProjectKeyTaken`: a `pgconn.PgError` with code `23505` and `ConstraintName` equal to the
  index name.
- `ProjectRepository.NextTaskNumber(ctx, id) (int, error)` *(new)*:
  `UPDATE projects SET task_counter = task_counter + 1 WHERE id = $1 RETURNING task_counter`.
- `TaskRepository`: every query reads `p.key` via `JOIN projects p ON p.id = t.project_id`;
  `Create` and `Update` write `number`.
- Integration tests: a taken key gives `PROJECT_KEY_TAKEN`; a deleted project's key is free again;
  the counter grows by one.

## The task `editor`

`server/internal/application/service/task/task.go` changes so that services get the locked projects
(steps 2 and 3 rely on this):

- `lockProjects` returns `map[entity.ProjectID]*entity.Project` of the projects it locked.
- `lock(ctx, taskID, userID, also...)` returns `(*entity.Task, *entity.ProjectMember,
  map[entity.ProjectID]*entity.Project, error)`.
- `edit`'s `apply` gets the map: `func(ctx, task *entity.Task, projects
  map[entity.ProjectID]*entity.Project, now time.Time) error`.

## Application services

- `CreateTaskService`: after `GetForUpdate`, takes the number from `NextTaskNumber` and passes number
  and key to the factory.
- `MoveTaskService`:
  - a move to the task's own project returns the task unchanged — no new number;
  - otherwise the number is `NextTaskNumber` of the target project, the key — the target's key from
    the map.
- `CreateProjectService` takes the key from `dto.CreateProject.Key`.
- `UpdateProjectService`: name and description need `RequireManager`; a key in the request also needs
  `RequireOwner`. `dto.ProjectChanges` gets `Key *string`.

## Contract

- Schema `ProjectKey`: string, 2–10 characters, `pattern` from the ADR.
- `Project.key` — required response field.
- `CreateProjectRequest.key` — required. `UpdateProjectRequest.key` — optional, not nullable; the
  `updateProject` description says only the owner may change it.
- `Task.number` (integer ≥ 1) and `Task.key` — required response fields.
- `409 PROJECT_KEY_TAKEN` on `createProject` and `updateProject`.

## Tests

The key becomes required, so every existing test helper and script that creates projects must send
a unique key. Add one helper that generates a key and use it in:

- `createProject` in `server/internal/presentation/http/v1/project_test.go`;
- `createProject` in `server/internal/infrastructure/repository/persistent/link_test.go` and other
  repository tests that insert projects;
- `server/test/apitest` if it creates projects;
- `scripts/stand-api.mjs` and `scripts/stand-smoke.mjs`;
- web test fixtures with projects (for example
  `web/src/presentation/features/projects/components/ProjectsList/ProjectsList.test.tsx`).

Service tests with gomock (`service/task/task_test.go`, `service/project/project_test.go`) need new
expectations for `NextTaskNumber` and the changed signatures.

Handler tests (`v1/project_test.go`, `v1/task_test.go`):

- a lower-case or Cyrillic key (`рмп`) is stored upper-case;
- a bad key (`1A`, `A`, `ABCDEFGHIJK`) → `422` with `details.key`; a taken key → `409`;
- `key: null` in `PATCH` → `422`; a body with only `key` from the owner → `200`;
- a project admin changing the key → `403`; the owner → `200`, and the task keys change;
- tasks are numbered 1, 2, 3; deletion does not free a number;
- a move gives the next number of the target project and a new key; a move to the same project
  changes nothing;
- `key` and `number` are present in responses of all task endpoints.

## Web

- `Project.key`, `Task.number`, `Task.key` in models and `mappers.ts`, with `mappers.test.ts`.
- `suggestProjectKey(name)` *(new)* in `shared/utils/projectKey.ts`:
  - first letters of the name's words, upper-case; a single word → its first three letters;
  - letters and digits only; leading digits are dropped; at most 10 characters;
  - a result shorter than 2 characters → an empty string: the user types the key;
  - test: «Разработка мобильного приложения» → `РМП`, «Design System» → `DS`, «Бюджет» → `БЮД`;
    «Я» and «2024 План» → an empty string (only one letter is left).
- `projectKeyField` *(new)* in `presentation/shared/forms/fields.ts` — zod, the ADR pattern with the
  `u` flag, upper-cases the value.
- Field «Ключ» in the new project form (`CreateProjectForm`), under the name. Until the user edits it,
  it follows `suggestProjectKey(name)`. Show `PROJECT_KEY_TAKEN` under the key field, not as a toast.
- In the edit project form (`EditProjectForm`) only the owner sees «Ключ»
  (`canChangeProjectKey` *(new)* in `shared/utils/userRole.ts`), with the hint
  «Ключи задач изменятся: DS-12 станет NEW-12».
- After a key change, refetch everything that holds task keys: `QUERY_KEYS.invalidate.project(id)`
  and the whole `["task"]` prefix.
- Task key as a `caption-reg` caption in `--text-secondary` above the task name:
  - project task cards: `presentation/features/projects/components/ProjectTask/` (`ProjectTask.tsx`,
    its `TaskList.tsx`);
  - «Мои задачи»: `presentation/features/tasks/components/TaskList/TaskList.tsx` — «DS-12 · Название
    проекта»;
  - the task page: `TaskInfo`.
- Project key in the author and date line of `ProjectInfo`: «Салунин Максим | 10.04.2025 | DS».

## Stack

`scripts/stand-smoke.mjs` creates its project with a random key (`S` plus six upper-case base36
characters) and checks that the first task's key is `<key>-1`.

## Done when

Common criteria from the stage README.

## Show the customer

The key suggestion in the new project form, keys on cards and the task page, the key change on a move
and after the owner edits the project key.
