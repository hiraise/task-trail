# ADR-0015: Service settings are in the admin UI; the environment holds only what the server cannot start without

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** `server/config/config.go`, `server/internal/app/`, `server/internal/infrastructure/`, `server/internal/presentation/http/v1/`, `server/migrations/`, `server/README.md`, `stand/compose.yaml`, `scripts/dev.sh`, admin section in `web/src/presentation/features/`, settings in the API contract

## Context

The customer wants to configure TaskTrail in the UI, integrations included, rather than by editing
`.env` and restarting. The server currently reads 27 environment variables.

## Decision

- Environment variables are only for startup. Two are required: `PG_CONNECTION_STRING`
  and `APP_SECRET`; the server does not start if `APP_SECRET` is shorter than 32 characters.
  Optional, with a default value: `PORT`, `APP_ROOT_PATH`, `FILES_DIR`
  ([ADR-0013](0013-files-on-server-disk.md)), `APP_DEBUG`. A new variable — only through an ADR.
- Whatever the administrator may want to change — service URL, mail, integrations — make a setting
  in the admin UI ([ADR-0014](0014-service-administrator.md)). Settings are stored
  in the database and take effect without a restart.
- Everything else is a constant in code: token lifetimes, cookie names, `iss`, connection pool size.
  Do not add a setting "just in case".
- Apply migrations on every start; embed the migration files in the binary (`embed`).
- Derive the token signing keys and the encryption key from `APP_SECRET` (HKDF with different labels).
- Store integration secrets (SMTP password, tokens) in the database encrypted with a key from
  `APP_SECRET` (AES-GCM). The API does not return them — only a "set" flag. Treat a secret that
  does not decrypt as not set: the server keeps working, the administrator enters it again.
- Send a saved secret only where it was entered for: if the integration's server or port changes,
  the secret is entered again.
- The service URL is the full web URL with its path, e.g. `https://example.com/tasktrail`. The web
  sends it when the first account is created, the server checks that it is an http(s) URL;
  the administrator can change it. Links in emails and invitations are built from it.
- Connect a new integration the same way: settings and connection check in the admin UI,
  without new environment variables.
- The local stack `scripts/dev.sh up` configures the server through the admin API, not through
  the environment.

## Consequences

- Changing `APP_SECRET` ends all sessions, and integration secrets have to be entered again.
- A backup is the database, the `FILES_DIR` folder and `APP_SECRET`.

## Alternatives

- A secret that the server generates itself and stores in the database — no: a leaked copy of the
  database would allow forging a session on the live server.
- A config file instead of `.env` — the same manual edit and restart.
