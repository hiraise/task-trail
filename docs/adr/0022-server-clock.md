# ADR-0022: The server takes the current time from `Clock`, not from `time.Now()`

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** calls to `time.Now`, `time.Since`, `time.Until` in `server/internal/`, entities and factories in `server/internal/domain/`, module assembly in `server/internal/app/`

## Context

Token and invitation expiry, token revocation and cleanup depend on the current time, and the server
takes it from `time.Now()` directly in entities, factories and repositories. A test cannot move time
forward, so expiry is tested approximately or not at all.

## Decision

- The `Clock` interface with the method `Now() time.Time` is in `internal/domain/service/clock.go`,
  the implementation on `time.Now()` is in `internal/infrastructure/service/clock/`. In the rest of
  the server code do not call `time.Now`, `time.Since` or `time.Until`.
- Entities receive the time as a parameter (`IsExpired(now)`) and do not hold a `Clock`: the entity
  rule stays a pure function.
- Factories and application services receive `Clock` in the module constructor (like `access.New`),
  assembled in `internal/app/`.
- Repositories do not take the time themselves: the timestamp comes in the entity or as a parameter.
- Tests use the fixed clock from `server/test/clock/`, which can be moved forward.
- The exception is measuring request duration in `presentation/http/middleware/log.go`.
- Move existing calls to `Clock` when you change their file; the check threshold only goes down.

## Verification

`scripts/rules.mjs` — calls to `time.Now`, `time.Since` and `time.Until` outside the `Clock`
implementation, tests and `middleware/log.go` do not exceed the threshold; moved a call to `Clock` —
lower the threshold.

## Alternatives

- A global variable `var now = time.Now`, swapped in tests — tests with `t.Parallel()`
  interfere with each other.
- `testing/synctest` fakes time only inside a test, and the time dependency stays
  hidden; it fits as a complement — for tests with timers, e.g. scheduled cleanup.
