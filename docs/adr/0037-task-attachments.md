# ADR-0037: A task has attachments — files of any type up to 25 MB, served to members of its project

- **Status:** Accepted
- **Date:** 2026-10-23
- **Affects:** table `task_attachments` and `files.size` in `server/migrations/`, `entity.File` and `entity.Attachment`, `server/internal/application/service/file/` and attachment services in `server/internal/application/service/task/`, `GET /v1/files/{fileId}` and its router in `server/internal/presentation/http/v1/file.go`, attachments in the API contract, `client_max_body_size` in `stand/nginx.conf.template`, the attachments block in `web/src/presentation/features/tasks/`

## Context

Attachments are an "after the core" item of [ADR-0004](0004-lightweight-tracker-scope.md). Storage is
already decided by [ADR-0013](0013-files-on-server-disk.md): the disk, `files`, type by content,
serving through the API, soft deletion and cleanup.

## Decision

- An attachment is a `files` row linked to a task: `task_attachments (file_id PRIMARY KEY, task_id,
  created_at)`. The uploader is `files.owner_id`. `files.size BIGINT NOT NULL DEFAULT 0` keeps the
  size for every new file.
- Any file type up to 25 MB (`entity.MaxAttachmentSize`); bigger — `422 FILE_TOO_LARGE`. The type is
  detected by the content; everything except JPEG, PNG and WebP is served as `attachment`
  (ADR-0013). There is no limit on the number of attachments.
- The local stack proxy accepts bodies up to the attachment limit (`client_max_body_size` for
  `/api/`); the avatar limit of 5 MB is checked by the server and the web only.
- `GET /v1/tasks/{taskId}/attachments` — newest first; `POST` (multipart, field `file`) — `201`;
  `DELETE /v1/tasks/{taskId}/attachments/{fileId}` — `204`. Any member of the task's project reads
  and uploads; the uploader, the project owner and admins delete, others get `403`. An archived task
  or project — `409` ([ADR-0027](0027-reversible-archive.md)).
- `Attachment { id, taskId, name, mimeType, size, author: User, createdAt }`; `id` is the
  `files.id` for `GET /v1/files/{fileId}`.
- `GET /v1/files/{fileId}` of an attachment: without a valid session — `401`, so the web refreshes
  the session and retries; not a member of the task's project or a deleted task — `404`. Avatars are
  served without sign-in, as before.
- A deleted attachment loses its `task_attachments` row and its file gets `soft_deleted_at`; the
  periodic cleanup erases it (ADR-0013). A deleted task keeps its attachments, unreachable with it
  ([ADR-0001](0001-soft-delete-project.md)). A moved task keeps them.
- Attachments write no history events ([ADR-0028](0028-task-activity-feed.md)): the list itself shows
  who added what and when.
- The web downloads an attachment through the API client (a `Blob`), so an expired session is
  refreshed; image previews are `<img>` tags loaded right after the attachment list.

## Alternatives

- S3-compatible storage — a separate ADR when a team needs it (ADR-0013).
- 100 MB per file — video and archives fill the disk of a small server quickly.
