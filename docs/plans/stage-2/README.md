# Stage 2 — tracker core: keys, archive, task activity, boards, search

Goal: the whole core of [ADR-0004](../../adr/0004-lightweight-tracker-scope.md) works on the local
stack. The web stubs (boards, comments, search, archive) are replaced with screens from Figma working
on the real API. The customer approved the decisions on 2026-10-22:

| ADR | Decision |
| --- | --- |
| [ADR-0026](../../adr/0026-project-and-task-keys.md) | project key and task number, task key `DS-12` |
| [ADR-0027](../../adr/0027-reversible-archive.md) | reversible archive of tasks and projects, archived items are read-only |
| [ADR-0028](../../adr/0028-task-activity-feed.md) | one feed under a task: comments and change history |
| [ADR-0029](../../adr/0029-boards-over-projects.md) | a board is a view over tasks of several projects; board membership grants no task access |
| [ADR-0030](../../adr/0030-search-by-substring.md) | search by substring in PostgreSQL |
| [ADR-0031](../../adr/0031-english-agent-docs-and-stage-plans.md) | English for agent docs, code comments, commits and PRs |

## Steps

Steps go strictly in order, one PR each. A later step relies on earlier ones: keys are needed by board
cards and search; archive — by the feed, boards and search. The contract, the server and the web of
a step change in one PR (ADR-0005).

| # | Step | File | Status |
| --- | --- | --- | --- |
| 0 | Code comments and developer-facing strings in English | [00-english-comments.md](00-english-comments.md) | done |
| 1 | Task keys `DS-1` | [01-task-keys.md](01-task-keys.md) | done |
| 2 | Archive and list sorting | [02-archive-and-sorting.md](02-archive-and-sorting.md) | done |
| 3 | Task activity: comments and history | [03-task-activity.md](03-task-activity.md) | done |
| 4 | Boards: list, creation, board info | [04-boards.md](04-boards.md) | done |
| 5 | Kanban and the task modal | [05-kanban.md](05-kanban.md) | done |
| 6 | Search | [06-search.md](06-search.md) | next |

Finished a step — set its status to `done` here and point "next" at the following step, in the same PR;
update "Where we are" in [the roadmap](../../roadmap.md).

## How to run a step

- Read this file, the step file and the ADRs the step names before writing code.
- Branch from a fresh `origin/main` (CLAUDE.md, "Branches and PRs").
- Work order: migration → domain → repositories with integration tests (`test/testdb`) → application
  services → contract → handlers with tests through `test/apitest` and `contract.Load(t).Check` →
  `npm run api:types` in `web/` → web → stack smoke → docs.
- Migration: the next free number in `server/migrations/` (`NNNNNN_name.up.sql` and `.down.sql`).
  Numbers in the step files are expected ones; if a number is taken, use the next one. `down` fully
  reverts `up`.
- A new error code goes through six places, all in the step that introduces the code:
  1. a constant and constructor in `server/internal/domain/errors.go`;
  2. a row in `apiErrorFor` in `server/internal/presentation/http/middleware/error.go`;
  3. a `response.Code…` constant;
  4. a value in `ErrorCode` of the contract;
  5. a value in `ApiErrorCode` in `web/src/shared/errors/types.ts` — the build compares it with the
     contract (`SameSet` in `web/src/infrastructure/http/apiError.ts`);
  6. a Russian text in `web/src/shared/locales/apiErrors.ts` — `apiErrorTexts` is `Partial`, so the
     build does not remind you.
- A changed repository interface in `server/internal/domain/repository/` needs regenerated mocks:
  `go run go.uber.org/mock/mockgen@v0.6.0 -source=… -destination=… -package=mocks` (see the header
  of a file in `server/test/mocks/`). Add every new interface file to the `mock` target in
  `server/Makefile`. Service tests in `server/internal/application/service/*/…_test.go` use strict
  gomock expectations: update them when a service starts calling something new.
- Merge only the `*Mobile`/`*Desktop` pairs the step lists; leave the other pairs for later steps.
- Names marked *(new)* in a step file do not exist yet — create them. Everything else exists; find it
  before writing a duplicate.
- Time comes only from `Clock` (ADR-0022); responses use `.UTC()`. IDs from a request body go through
  `request.normalizeID`. A body field that may be absent or `null` uses `request.Optional`.
- Permissions are checked by entity methods under a lock (`ProjectRepository.GetForUpdate`, for
  boards — `BoardRepository.GetForUpdate`). A non-member gets `404`, a member without the role —
  `403` (ADR-0018).
- Web: one adaptive component per screen (ADR-0008). After merging a `*Mobile`/`*Desktop` pair, lower
  `DEVICE_SPLIT_LIMIT` in `scripts/rules.mjs` — the check prints the new value. Requests go only
  through repositories; responses
  are mapped to models in `mappers.ts` (ADR-0024). UI texts are Russian and live in
  `web/src/shared/locales/`. Colors and fonts — CSS variables (`docs/design-system.md`).
- A new shared web component goes into `docs/design-system.md` in the same PR.
- A step is done when `scripts/dev.sh check` is green, `scripts/dev.sh up` and `smoke` pass on the
  stack, the result is shown to the customer (in Russian, CLAUDE.md) and this file, the roadmap and,
  when users see the change, the root `README.md` (in Russian) are updated.

## Design

Figma (the file key is in CLAUDE.md), pages «Доски», «Задачи», «Поиск» and «Проекты». Step files
name frames by node ID: `get_screenshot` shows a frame, `get_design_context` gives sizes and spacing.
Three widths: phone 393, tablet 768, desktop 1200+.

- Status names in the mockups (Open, In progress, To verify, Done) are placeholders. The web takes them
  from `GET /v1/task-statuses`.
- UI texts are Russian. The «Archive» tag of the mockups is written «Архив».
- Whatever Figma lacks is described in the step files and was approved with this plan — no separate
  mockup is needed for it. A screen or state found neither in Figma nor in the plan needs a mockup
  approved by the customer (ADR-0025).

## Code map

Patterns to copy. The task module is the closest template for most server work.

**Server** (`server/internal/`, layers — ADR-0007):

- entities `domain/entity/`, factories `domain/factory/`, repository interfaces `domain/repository/`,
  errors `domain/errors.go`;
- PostgreSQL repositories `infrastructure/repository/persistent/` (`insert`, `ScanRows`, `handleError`;
  `getDb(ctx)` joins the current transaction); template — `persistent/task.go`;
- application services `application/service/<module>/`: a module struct, `Deps` and `New`;
  transactions — `TxManager.DoWithTx`; template — `service/task/` (`editor.lock`, `editor.edit`);
- DTOs `application/dto/`;
- handlers `presentation/http/v1/<module>.go` with `request/` (binding, `validate[T]`, `normalize()`,
  custom validators in `request/validators.go`) and `response/`; `pathID` in `v1/path.go`;
  routes — `v1/router.go`; wiring — `internal/app/app.go`;
- tests: `test/testdb` (repositories on PostgreSQL), `test/apitest` (`apitest.New(t, contract.Load(t))`,
  `s.Do`, `apitest.RequireStatus`, `apitest.Decode`; helpers like `registerAdmin` and `createTask`
  in `v1/*_test.go`), `test/clock`, `test/txtest`, `test/mocks`.

**Web** (`web/src/`, layers — ADR-0008):

- models `domain/models/`, repository interfaces `domain/repositories/`;
- API repositories `infrastructure/repositories/api*Repository.ts`, `mappers.ts`; addresses —
  `infrastructure/config/apiRoutes.ts`; generated types `infrastructure/api/generated/`
  (`npm run api:types`);
- cache keys `shared/constants/queryKeys.ts`; task cache helpers
  `presentation/features/tasks/hooks/taskCache.ts` (`storeTask`, `invalidateTaskLists`);
- features `presentation/features/<feature>/{components,hooks,pages,modals}`; shared parts
  `presentation/shared/{ui,components,modals,forms,hooks}`;
- modals: `MODAL_TYPE` in `presentation/app/components/GlobalModalContext.tsx`,
  `lazyModalComponents.ts`, `useGlobalModals`;
- routes — files in `routes/` (TanStack Router, `routeTree.gen.ts` is generated);
- errors `shared/errors/` (`toastError`, `hasErrorCode`), API error texts `shared/locales/apiErrors.ts`,
  role permissions `shared/utils/userRole.ts`.

**Stack:** smoke — `scripts/stand-smoke.mjs`, API client — `scripts/stand-api.mjs`.
