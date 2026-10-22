# ADR-0024: The web maps API responses to models without schemas and tells errors apart by the `ApiError` code

- **Status:** Accepted
- **Date:** 2026-10-22
- **Affects:** `web/src/infrastructure/http/`, `web/src/infrastructure/repositories/`, `web/src/domain/models/`, `web/src/shared/errors/`, `web/src/shared/locales/apiErrors.ts`

## Context

The web takes response types from the contract ([ADR-0020](0020-web-api-types.md)), and the server's
contract tests check the shape of its responses ([ADR-0019](0019-server-contract-tests.md)). Zod
response schemas in `domain/models` repeated the contract by hand and drifted from it: `avatarUrl: null`
broke sign-in. Repositories replaced errors with their own text, and the code from `ApiError`
([ADR-0018](0018-api-conventions.md)) never reached the screen.

## Decision

- A repository receives the API response in the generated type and maps it to a `domain` model with
  a plain function (`infrastructure/repositories/mappers.ts`). Do not validate responses with schemas:
  zod is only for forms.
- IDs in models are strings from the API, without converting to a number and back.
- The repository builds the file (avatar) link from the file ID: `fileUrl` in
  `infrastructure/config/apiRoutes.ts`; the model stores the ready URL.
- `HttpClient` throws `AppError` with `code` and `details` from `ApiError` (`infrastructure/http/apiError.ts`).
  Repositories do not catch errors and do not replace them with their own text.
- The web's list of codes is `ApiErrorCode` in `shared/errors/types.ts`; the build checks that it
  matches the contract's `ErrorCode`.
- Show the user the text for the code from `shared/locales/apiErrors.ts` (`errorMessage`,
  `toastError` in `shared/errors/errorMessage.ts`); do not show `message` from the response.
- Session, network, timeout and unknown errors are shown by `handleGlobalError`, the rest by the screen
  that made the request; `toastError` does not show global errors a second time.
- For requests that send emails within the request itself ([ADR-0017](0017-mail-in-admin-ui.md)), set
  the timeout `MAIL_REQUEST_TIMEOUT_MS`; `REQUEST_TIMEOUT_MS` is enough for the rest
  (`infrastructure/http/timeouts.ts`).

## Consequences

- Zod response schemas of projects, members, tasks and statuses go away as their repositories move
  to the contract (stage 1, steps 6.2 and 6.3, [roadmap](../roadmap.md)).

## Verification

`npm run build` in `web/` fails if `ApiErrorCode` and the contract's `ErrorCode` diverge; the tests
`mappers.test.ts` and `apiError.test.ts` cover mapping of responses and errors.

## Alternatives

- Validating responses with schemas in the web — a second copy of the contract, kept in sync by hand.
