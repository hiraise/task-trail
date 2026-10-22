# Step 0 — code comments and developer-facing strings in English

Read first: [ADR-0031](../../adr/0031-english-agent-docs-and-stage-plans.md), the stage
[README](README.md). No behavior, contract semantics or UI changes in this step — only comments
and texts meant for developers.

## Translate to English

- Comments in every source and config file: `server/` (Go, SQL migrations, `Makefile`,
  `.golangci.yml`, `docker/`), `web/` (TS, TSX, CSS, config files), `scripts/` (`.mjs`, `.sh`),
  `stand/`, `api/` (Go files), `.github/`.
  Editing comments in already applied migrations is safe: `golang-migrate` tracks only versions,
  not file contents (`server/internal/pkg/postgres/migrate.go`).
- Developer-facing strings:
  - log messages (`logger` calls);
  - the API error `message` in `apiErrorFor` and `validationError`
    (`server/internal/presentation/http/middleware/error.go`) and other `message` texts — the web
    never shows them (ADR-0024);
  - output of `scripts/dev.sh`, `scripts/rules.mjs`, `scripts/stand-*.mjs`;
  - test names and failure messages (`t.Run`, `t.Errorf`, `t.Fatalf`, vitest `describe`/`it`).
- `api/openapi.yaml`: `summary`, `description` and tag descriptions. Swagger is for developers.
  Keep schemas, names, enums and examples unchanged.

## Keep in Russian

- UI texts: `web/src/shared/locales/`, and Russian string literals in components (placeholders and
  similar) — do not move or translate them in this step.
- Validation `details` texts from `messageForTag` (`middleware/error.go`): the web shows them under
  form fields (`web/src/presentation/features/admin/components/MailForm/useMailForm.ts`).
- Emails: `server/internal/application/letter/`.
- Status names in `server/internal/domain/entity/task_status.go` — the UI shows them.
- Test data that is Cyrillic on purpose (names, expected UI texts and status names).
- Workflow and job names in `.github/workflows/` (for example `name: Проверка`): required status
  checks of the branch protection and the `/merge` skill find the check by its name. Comments in
  those files are translated.

## Guard against regressions

Add `checkCommentLanguage()` to `scripts/rules.mjs` (call it with the other checks) and name it in
the "Verification" section of ADR-0031:

- fails on Cyrillic inside comments: `//` and `/* … */` in `.go`, `.ts`, `.tsx`, `.js`, `.mjs`, `.css`;
  `#` in `.sh`, `.yml`, `.yaml`, `Makefile`, `Dockerfile*`, `stand/*.template`; `--` in `.sql`;
- fails on Cyrillic in `summary` and `description` lines of `api/openapi.yaml`;
- reports `file:line`; string literals are not checked;
- must report zero problems on the translated tree. If a string literal is caught by mistake (for
  example, `//` inside a URL), make the regular expression stricter instead of adding exceptions.

## How

- Go package by package (`domain`, `application`, `infrastructure`, `presentation`, `test`), then
  `web/src` by layer, then scripts and configs. One commit per area keeps the diff reviewable.
- Change nothing but comments and the strings listed above. If a test asserts a translated message,
  update the test.
- Keep comments short and in the same place; do not add new ones.
- After each area run `scripts/dev.sh check`; at the end run `scripts/dev.sh up` and `smoke`.
- At the end, `grep -rn "[А-Яа-яЁё]" server web/src scripts stand api .github` must show only the
  "Keep in Russian" places. Put that summary into the PR description.

## Done when

- `scripts/dev.sh check` is green, including the new rule; the stack smoke passes.
- The stage README marks step 0 `done` and step 1 `next`.

## Show the customer

`git diff --stat`, the `grep` summary of what stays in Russian, and `scripts/dev.sh check` output.
