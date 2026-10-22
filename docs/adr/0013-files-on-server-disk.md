# ADR-0013: Files are stored on the server disk and served through the API

- **Status:** Accepted
- **Date:** 2026-10-21
- **Affects:** the `files` table in `server/migrations/`, file upload and serving in `server/internal/`, `server/config/config.go`, `stand/compose.yaml`, `stand/nginx.conf.template`, avatar upload in `web/src/`

## Context

Avatars, and at stage 3 also attachments, need storage. The old API put files in S3, and for
self-hosted that is one more service to install (principle 2 in [CLAUDE.md](../../CLAUDE.md)).

## Decision

- Store files in a directory on the server disk; `FILES_DIR` sets the path. In Docker it is a volume.
- Name the file on disk by `files.id`. Store the original name and the MIME type only in `files`;
  do not build the disk path from user data.
- Detect the type by the file content, not by the request header. An avatar is JPEG, PNG or WebP
  up to 5 MB. Keep the size limit the same in the server, the web and the local stack proxy
  (`client_max_body_size`).
- Serve files only through the API; nginx does not serve the directory. Serve an avatar by `files.id`
  without a sign-in check: the ID is a random UUIDv4, and `<img>` cannot refresh an expired token.
  Serve an attachment only to members of its project.
- Serve files with `X-Content-Type-Options: nosniff` and `Cache-Control: private, max-age=31536000,
  immutable`: the file at a `files.id` never changes. Serve everything except JPEG, PNG and WebP with
  `Content-Disposition: attachment`, otherwise HTML or SVG will run a foreign script on the web origin.
- Make storage an interface in `internal/domain`, with the disk implementation in `internal/infrastructure`
  ([ADR-0007](0007-server-architecture.md)).
- If the transaction fails, delete the written file. Mark an unneeded file (a replaced avatar, a deleted
  attachment) with `files.soft_deleted_at`; a periodic cleanup erases it from disk and sets
  `deleted_at`, and also erases files older than a day that have no row in `files`.

## Consequences

- A backup is the database dump and the `FILES_DIR` directory together. The future release ADR must
  mount the directory as a volume.
- S3-compatible storage can be added as a second implementation of the interface — in a separate ADR.

## Alternatives

- S3 (MinIO) by default — one more service to install; a small team has enough with a disk.
