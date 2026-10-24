# ADR-0042: A vX.Y.Z tag on main publishes images to GHCR; a server runs them with `deploy/compose.yaml`

- **Status:** Accepted
- **Date:** 2026-10-24
- **Affects:** `.github/workflows/release.yml`, `images` in `scripts/dev.sh`, `server/docker/Dockerfile`, `web/docker/`, `deploy/compose.yaml`, `stand/compose.yaml`, README «Установка на свой сервер»

## Context

TaskTrail is ready to run on a server. What the repository ships is the images and an example
compose file; the proxy, certificates and how the stack is run are up to the person who installs it.

## Decision

- Release by a git tag `vX.Y.Z` (semver) on a commit of `main`; the customer cuts it, or an agent when
  asked: `git tag v1.0.0 origin/main && git push origin v1.0.0`. The workflow refuses a tag off `main`.
- The workflow builds images with `scripts/dev.sh images <X.Y.Z> --push` and pushes
  `ghcr.io/hiraise/task-trail-server` and `ghcr.io/hiraise/task-trail-web`, `linux/amd64`, tagged
  `X.Y.Z`; the newest release also gets `latest`. Then a GitHub release with notes and
  `deploy/compose.yaml` attached.
- Images are public and need no registry login; a released tag is never pushed again — a fix is a new
  version.
- Delivery to a server is manual: the stack follows `latest`, the administrator pulls the images
  after a release; `TASKTRAIL_VERSION` pins a version or rolls back to one.
- The web image is self-contained: its nginx (`web/docker/nginx.conf.template`) serves the build and
  proxies `/api/` to the `server` service; build defaults are `API_URL=/api`, `ROOT_PATH=""`.
- The local stack builds the same Dockerfiles with the same nginx config and adds nothing on top,
  so `scripts/dev.sh up` and `smoke` check what a release ships.
- `deploy/compose.yaml` runs `postgres`, `server` and `web` from images and publishes only the web port
  (`TASKTRAIL_PORT`); no proxy or orchestrator specifics in it. An HTTPS proxy goes in front:
  session cookies are `Secure`.
- Secrets are only `APP_SECRET` and `POSTGRES_PASSWORD`, set on the server, not in git.
  Everything else is configured in the admin UI (ADR-0015).
- Pin base images by version in Dockerfiles and `deploy/compose.yaml`.

## Consequences

- Migrations run on server start and only forward: rolling back the image does not roll back the
  database; a migration that an older version cannot run with is named in the release notes.
- A change of `deploy/compose.yaml` or a new required server variable is named in the release notes:
  an installed stack does not follow git.

## Alternatives

- Images of every `main` and automatic redeploy by a webhook — the customer prefers to deliver by hand
  after a release.
- Portainer builds images from the repository on the server — slow, needs the toolchain there, and the
  running code is not tied to a version.
- A proxy with certificates or Traefik labels inside `deploy/compose.yaml` — every server has its own
  proxy; the customer sets it up outside the repository.
