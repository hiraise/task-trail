# Stage 3 — after the core: priority, due date, labels, subtasks, attachments, notifications

Goal: the "after the core" items of [ADR-0004](../../adr/0004-lightweight-tracker-scope.md) work on the
local stack: a task has a priority, a due date, labels, subtasks and attachments; people get
notifications in the web and by email, and can mention each other in comments. Decisions of the stage:

| ADR | Decision |
| --- | --- |
| [ADR-0033](../../adr/0033-task-priority.md) | four fixed priorities, `normal` by default, `priority_changed` event |
| [ADR-0034](../../adr/0034-task-due-date.md) | optional due date — a calendar day, `due_date_changed` event, "overdue" in the web |
| [ADR-0035](../../adr/0035-project-labels.md) | labels per project with a fixed palette; any member creates, the owner and admins manage |
| [ADR-0036](../../adr/0036-subtasks.md) | a subtask is a task with a parent, one level, `parent_changed` event |
| [ADR-0037](../../adr/0037-task-attachments.md) | attachments up to 25 MB, any type, served to project members |
| [ADR-0038](../../adr/0038-notifications.md) | notifications in the web, emails in the background, due date reminders |
| [ADR-0039](../../adr/0039-comment-mentions.md) | mentions `@[Name](userId)` in comments notify the person |

The plan is written for agents working at a medium effort level: every step names the files, types,
functions, SQL, tests and texts it needs. Do what the step says; if the code differs from the step
file (a name moved, a function has another signature), follow the code, keep the step's intent and
mention the difference to the customer.

## Steps

Steps go strictly in order, one PR each ([ADR-0032](../../adr/0032-one-session-plan-steps.md)): a server
step (migration, server, contract, `npm run api:types`) and then its web step. Step 0 (mockups) must be
approved before step 2 — the first web step; server steps 1 and 3 may be done before the approval.

| # | Step | File | Status |
| --- | --- | --- | --- |
| 0 | Mockups of all stage 3 screens | [00-mockups.md](00-mockups.md) | done |
| 1 | Priority — server | [01-priority-server.md](01-priority-server.md) | done |
| 2 | Priority — web, the shared card line `TaskMeta` | [02-priority-web.md](02-priority-web.md) | done |
| 3 | Due date — server | [03-due-date-server.md](03-due-date-server.md) | done |
| 4 | Due date — web | [04-due-date-web.md](04-due-date-web.md) | done |
| 5 | Labels — server | [05-labels-server.md](05-labels-server.md) | done |
| 6 | Labels on a task — web | [06-task-labels-web.md](06-task-labels-web.md) | done |
| 7 | Project labels management — web | [07-project-labels-web.md](07-project-labels-web.md) | done |
| 8 | Subtasks — server | [08-subtasks-server.md](08-subtasks-server.md) | next |
| 9 | Subtasks — web | [09-subtasks-web.md](09-subtasks-web.md) | |
| 10 | Attachments — server | [10-attachments-server.md](10-attachments-server.md) | |
| 11 | Attachments — web | [11-attachments-web.md](11-attachments-web.md) | |
| 12 | Notifications — server | [12-notifications-server.md](12-notifications-server.md) | |
| 13 | Notification emails and due date reminders — server | [13-notification-emails-server.md](13-notification-emails-server.md) | |
| 14 | Notifications — web | [14-notifications-web.md](14-notifications-web.md) | |
| 15 | Mentions — server | [15-mentions-server.md](15-mentions-server.md) | |
| 16 | Mentions — web | [16-mentions-web.md](16-mentions-web.md) | |

Finished a step — set its status to `done` here and `next` on the following step, in the same PR;
update "Where we are" in [the roadmap](../../roadmap.md). The PR of step 16 also updates the root
`README.md` (Russian): features, «План», the line about the current stage.

The customer accepted the ADRs above on 2026-10-23, together with this plan.

## How to run a step

The session order — from a fresh branch to the hand-off — is the `/step` skill. The work order inside
a step:

1. A server step: migration → domain (entity, errors, factory) → repository interface,
   PostgreSQL repository, mocks, repository tests → application services and their tests → contract
   `api/openapi.yaml` → request/response/handler and handler tests → `npm run api:types` in `web/` →
   `scripts/stand-smoke.mjs` → docs. A server step ends after `npm run api:types`: the web does not use
   the new types yet, but `scripts/dev.sh web` compares them with the contract.
2. A web step: model and mapper with tests → repository → cache keys and hooks → shared
   components → feature components → texts → `docs/design-system.md` → stack check with `/ui-check`.

## Rules for every step

**Server**

- Migration: the next free number in `server/migrations/` (`NNNNNN_name.up.sql` and `.down.sql`); the
  step names the expected number, take the next free one if it is taken. `down` fully reverts `up`
  (drop indexes, columns and tables in reverse order). Comments in SQL are English (`--`).
- Time comes only from `Clock` (ADR-0022): `e.clock.Now()` in services, `now` passed into entity
  methods; never `time.Now()` outside tests. Responses use `.UTC()`.
- IDs from a request body go through `request.normalizeID` in the request's `normalize()`.
- Permissions: entity methods under the project lock (`ProjectRepository.GetForUpdate` via
  `editor.lock` / `editor.edit` in `service/task/task.go`). A non-member gets `404` (repositories return
  `ENTITY_NOT_FOUND`), a member without the role — `403` (`ProjectMember.RequireManager`).
  Archived: `Project.RequireActive()` → `409 PROJECT_ARCHIVED`, `Task.RequireActive()` → `409 TASK_ARCHIVED`.
- A new error code goes through six places in the same step:
  1. a constant with a comment and a constructor in `server/internal/domain/errors.go`
     (copy `CommentEditExpired` / `ErrCommentEditExpired`);
  2. a `response.Code…` constant in `server/internal/presentation/http/v1/response/error.go`;
  3. a row in `apiErrorFor` in `server/internal/presentation/http/middleware/error.go`;
  4. a value in `ErrorCode` of `api/openapi.yaml` (and a response in `components/responses` if
     several operations use it);
  5. a value in `ApiErrorCode` in `web/src/shared/errors/types.ts` — the build compares it with the
     contract (`SameSet` in `web/src/infrastructure/http/apiError.ts`), so a server step changes the web
     type too;
  6. a Russian text in `web/src/shared/locales/apiErrors.ts` — `apiErrorTexts` is `Partial`, the build
     does not remind you.
- A new or changed repository interface in `server/internal/domain/repository/` (or
  `domain/service/`) needs mocks: add a line to the `mock` target in `server/Makefile` for a new file
  and run, from `server/`,
  `go run go.uber.org/mock/mockgen@v0.6.0 -source=internal/domain/repository/<file>.go -destination=test/mocks/mock_<file>.go -package=mocks`.
  Service tests use strict gomock expectations: when a service starts calling something new, add the
  expectation in `server/internal/application/service/<module>/*_test.go`.
- Every handler test file in `server/internal/presentation/http/v1/` creates the server with
  `apitest.New(t, contract.Load(t))`: requests and responses are checked against the contract, so an
  undocumented field or status fails the test.
- History events: a new kind is a constant in `entity/task_event.go`, a constructor in
  `factory/task_event.go`, fields in `taskEventData` (`persistent/task_event.go`, `omitempty`), in
  `response.TaskEvent` (`response/activity.go`) and in the contract `TaskEvent` (required, nullable)
  and `TaskEventKind`. The event is written only if the value changed.

**Contract** (`api/openapi.yaml`, conventions — ADR-0018)

- A new response field is listed in `required`; an empty value is `null` (`type: [string, "null"]`).
- Every operation lists `500`, `401` and its other statuses with the shared `components/responses`.
- Descriptions name the role and the ADR. Only English in `summary` and `description` (the rules
  check fails on Cyrillic there).
- After a contract change run `npm run api:types` in `web/` and commit
  `web/src/infrastructure/api/generated/`.

**Web** (ADR-0008, ADR-0024, `docs/design-system.md`)

- Requests go only through repositories (`infrastructure/repositories/api*Repository.ts`); responses
  are mapped to models in `mappers.ts` (`null` → `undefined` for optional fields) with a test in
  `mappers.test.ts`. Addresses — `infrastructure/config/apiRoutes.ts`.
- Cache keys only in `shared/constants/queryKeys.ts`. A task change is stored with `storeTask` from
  `presentation/features/tasks/hooks/taskCache.ts` (it updates the task, its events and the lists).
- One adaptive component per screen. Do not create files named `*Mobile*.tsx` or `*Desktop*.tsx`:
  `DEVICE_SPLIT_LIMIT` in `scripts/rules.mjs` is already at the limit. Switch layouts with CSS
  (`@media (min-width: 768px)`).
- Colors only through CSS variables; new ones go into `web/src/styles/globals.css` (tokens) and
  `docs/design-system.md`. Literal colors in feature CSS fail `checkStyleTokens`.
- UI texts are Russian and live in `web/src/shared/locales/` (`tasksTexts` in `tasks.ts` for tasks).
  Placeholders `{name}` are filled with `interpolate` (`shared/utils/interpolate.ts`).
- Icons: our own SVG in `web/src/assets/icons/`, 24×24, `stroke="currentColor"`, stroke width 1.1–1.4,
  no fill, registered in `ICONS` (`web/src/shared/config/icons.ts`). No third-party icon sets.
- A modal: five places — `MODAL_TYPE` in `presentation/app/components/GlobalModalContext.tsx`,
  `MODAL_COMPONENTS` in `GlobalModalManager.tsx`, a lazy export in `lazyModalComponents.ts`, a `show…`
  method (and its props interface) in `presentation/shared/hooks/useGlobalModals.ts`, the feature
  `modals/index.ts`. Copy `ChangeTaskStatusModal`: on a phone a picker closes on selection, wider —
  `DialogButtons` with «Применить».
- Features do not import each other through `@/presentation/features/...`. Inside a feature, import
  another feature by a relative path of any depth (from `features/x/components/Y/Y.tsx` it is
  `../../../projects/hooks`; from `features/x/hooks/` — `../../projects/hooks`). In `presentation/shared`
  and `presentation/app` a relative import of three or more levels (`../../../`) fails lint.
- Global modals: nothing closes them on navigation, and `Dialog` closes on Escape caught on `window`.
  A link inside `TaskModal` must call `closeAllModals()` (from `useGlobalModals`) before it navigates; a
  field inside a modal that handles Escape itself calls `event.stopPropagation()`.
- A new shared component goes into `docs/design-system.md` in the same PR.
- Tests: Vitest + Testing Library next to the code (`*.test.ts(x)`); pure functions get tests always,
  components — when the step says so. Examples: `EditTaskForm.test.tsx`,
  `admin/hooks/mailHooks.test.ts`, `TaskActivity/feed.test.ts`.

**Code comments and docs** are English (ADR-0031). Comment a rule an agent would break; do not retell
the code.

## Recipe: a new task field (steps 1, 3, 8)

Server places that list task columns — change all of them together, or reads and writes go out of
sync:

1. `server/internal/domain/entity/task.go` — the field, a change method that sets `UpdatedAt`,
   `NewTask` arguments.
2. `server/internal/domain/factory/task.go` — `TaskFactory.New` arguments.
3. `server/internal/infrastructure/repository/persistent/task.go`:
   - `Create` — the column in the insert map;
   - `taskColumns` — the column (or a subquery) in the `SELECT` list;
   - `scanTask` — the matching `Scan` target, in the same position;
   - `Update` — the column in `SET`.
   `taskColumns` and `scanTask` are also used by `PGBoardRepository.ListTasks` (`persistent/board.go`)
   and `Search` — they need no other change.
4. `server/internal/application/dto/task.go` — `CreateTask` gets the field.
5. `server/internal/presentation/http/v1/request/task.go` — `createTaskReq`, `BindCreateTask`, a new
   request struct and `Bind…` for the change endpoint.
6. `server/internal/presentation/http/v1/response/task.go` — `Task` and `NewTask`.
7. `server/internal/presentation/http/v1/task.go` — a handler method and a route in `NewTaskRouter`.
8. `api/openapi.yaml` — `Task` (`required` too), `CreateTaskRequest`, the new path.
9. Callers of `entity.NewTask`/`TaskFactory.New` with positional arguments: `factory/task.go`,
   `entity/task_test.go`, `persistent/task_test.go` (`newTask`), `service/task/tasks.go` — `go vet ./...`
   finds them all. Keyed `entity.Task{…}` literals (`stored`, `archivedTask` in
   `service/task/task_test.go`) and raw `INSERT INTO tasks` in repository tests (`insertTask` in
   `persistent/project_test.go`, `search_test.go`) keep working: new columns have defaults or are
   nullable.
10. Service tests build the module in `newModule` (`service/task/task_test.go`) with gomock mocks of
   every `Deps` field the tested code calls: a new dependency needs a new mock there.

Web places (steps 2, 4, 9): `domain/models/Task.ts`, `toTask` in `infrastructure/repositories/mappers.ts`
and every DTO fixture in `mappers.test.ts` — tests are type-checked by `tsc -b`, so new required
contract fields must be in the `dto` of `describe("toTask")`, the task inside `describe("toSearchResult")`
and, for event fields, the `dto` of `describe("toTaskEvent")`; `NewTask` in
`domain/repositories/TaskRepository.ts`, `create` in `apiTaskRepository.ts`, test fixtures that build a
full `Task` (search: `grep -rn "projectArchived:" web/src --include=*.tsx --include=*.ts`).

## Common mistakes

- Forgetting `required` for a new response field in the contract — the handler tests pass, the web
  types get `?:` and the mapper silently loses `null`.
- Adding a column to `taskColumns` but not to `scanTask` in the same position — every task request
  fails with a scan error.
- A Cyrillic comment in Go, TS, CSS, SQL or the contract description — `scripts/dev.sh rules` fails.
- A new `ErrorCode` in the contract without `ApiErrorCode` in the web — `scripts/dev.sh web` fails
  in `apiError.ts`.
- `time.Now()` in server code — the rules check fails (ADR-0022).
- A mock not regenerated after an interface change — `go vet` fails in `test/mocks`.
- A web component with a `*Mobile`/`*Desktop` name — the rules check fails.
- `npm run api:types` not run after a contract change — `scripts/dev.sh web` fails on the diff.

## Design

New screens follow the mockups approved in step 0 ([00-mockups.md](00-mockups.md)) — the canvas
[«TaskTrail — этап 3»](https://claude.ai/artifact/HxcqoKqupKL65NSs5nTPMC) on claude.ai; step files
name its artboards by letter. Token values, icons and agreed deviations — «Approved values» in
00-mockups.md. Existing screens are in Figma (the file key is in CLAUDE.md): the task page, the kanban
and the lists. Tokens and components —
[docs/design-system.md](../../design-system.md). A state found neither in the mockups nor in a step
file needs the customer's approval (ADR-0025).

## Code map

Patterns to copy. The task module is the template for most server work.

**Server** (`server/internal/`, layers — ADR-0007):

- entities `domain/entity/`, factories `domain/factory/`, repository interfaces `domain/repository/`,
  errors `domain/errors.go`;
- PostgreSQL repositories `infrastructure/repository/persistent/` (`r.insert`, `ScanRows`,
  `r.handleError`, `r.getDb(ctx)` joins the current transaction); template — `persistent/task.go`,
  JSON column — `persistent/task_event.go`;
- application services `application/service/<module>/`: a module struct, `Deps`, `New`; transactions —
  `TxManager.DoWithTx`; task changes — `editor.edit` and `editor.commentChange`
  (`service/task/task.go`, `service/task/activity.go`); users for a response — `feed.people`;
- DTOs `application/dto/`; letters `application/letter/letter.go`; links `application/link/link.go`;
- handlers `presentation/http/v1/<module>.go` with `request/` (`validate[T]`, `normalize()`,
  `Optional[T]`, validators in `request/validators.go`) and `response/`; `pathID` in `v1/path.go`;
  routes `v1/router.go` (`Modules`); wiring and periodic jobs — `internal/app/app.go` (`New`, `Run`,
  `cleanup`);
- tests: `test/testdb` (repositories on PostgreSQL), `test/apitest` (`apitest.New`, `s.Do`,
  `apitest.Decode`, `apitest.RequireStatus`, `apitest.RequireError`, `s.AddMember`, `s.Clock.Advance`,
  `apitest.Multipart`), `test/clock`, `test/txtest`, `test/mocks`, `test/smtptest`; helpers in
  `v1/*_test.go`: `registerAdmin`, `createProject`, `signUp`, `createTask`, `changeTask`, `session`,
  `writeComment`, `events`, `requireEvents`.

**Web** (`web/src/`, layers — ADR-0008):

- models `domain/models/`, ID types `domain/types/EntityIds.ts`, repository interfaces
  `domain/repositories/`, payloads `application/payloads/`;
- API repositories `infrastructure/repositories/api*Repository.ts` (exported instances in
  `infrastructure/repositories/index.ts`), `mappers.ts`; generated types
  `infrastructure/api/generated/` (only `infrastructure/` imports them);
- task hooks `presentation/features/tasks/hooks/` (`useTaskActions`, `useTaskDetail`, `taskCache.ts`);
  the task page `features/tasks/pages/TaskPage/`, the kanban modal `features/tasks/modals/TaskModal/`,
  `features/tasks/components/TaskInfo/` (`TaskInfo`, `TaskField`), the feed
  `features/tasks/components/TaskActivity/`; the create form `features/tasks/components/CreateTaskForm/`
  (`SelectionField` in `FormSelectionOptions.tsx`) with its draft store
  `features/tasks/store/createTaskFormStore.ts` (`useCreateTaskFormStore`; `reset` sets the `empty`
  object, so defaults go there);
- cards: `features/projects/components/ProjectTask/ProjectTask.tsx` (project, board and search lists),
  `features/tasks/components/TaskList/TaskList.tsx` («Мои задачи»),
  `features/boards/components/KanbanBoard/KanbanCard.tsx`;
- shared parts `presentation/shared/{ui,components,modals,forms,hooks}`; layout
  `presentation/shared/components/Layout/` (`Drawer`, `BottomNavBar`, `PagesMobileTemplate`);
- texts `shared/locales/`, dates `shared/utils/formatters.ts` (date-fns, `ru` locale), sorting
  `shared/utils/sortItems.ts`, roles `shared/utils/userRole.ts`, routes `shared/config/routes.ts` and
  files in `routes/` (TanStack Router; `routeTree.gen.ts` is generated by the build).

**Stack:** smoke — `scripts/stand-smoke.mjs` (add checks inside the `try` block before the avatar step;
update its header comment and the `smoke` line of the root README), API client — `scripts/stand-api.mjs`.
