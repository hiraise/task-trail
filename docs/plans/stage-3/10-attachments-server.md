# Step 10 — attachments on the server

Read first: [ADR-0037](../../adr/0037-task-attachments.md), [ADR-0013](../../adr/0013-files-on-server-disk.md),
[ADR-0027](../../adr/0027-reversible-archive.md), the stage [README](README.md). The web part is
[step 11](11-attachments-web.md). Names marked *(new)* do not exist yet.

The avatar upload is the template for everything here: `service/user/avatar.go` (`UploadAvatarService`),
`request/user.go` (`BindAvatar`, `bodyError`, `multipartOverhead`), `v1/file.go`, `v1/user_test.go`
(`TestAvatar`, `TestAvatarRejected`, helpers `pngImage`, `avatar`, `filesOnDisk`, `anonymous`) and
`service/user/user_test.go` (`TestUploadAvatarTxFailed`). Read them first.

## Migration `000014_task_attachments`

```sql
-- up
-- Attachments of tasks (ADR-0037): a file linked to a task; the uploader is files.owner_id.
ALTER TABLE files ADD COLUMN size BIGINT NOT NULL DEFAULT 0;
CREATE TABLE task_attachments (
    file_id UUID PRIMARY KEY REFERENCES files(id),
    task_id UUID NOT NULL REFERENCES tasks(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id, created_at DESC);
-- down
DROP TABLE task_attachments;
ALTER TABLE files DROP COLUMN size;
```

## Domain

- `entity/file.go`: `File.Size int64` *(new)*; `const MaxAttachmentSize = 25 << 20`;
  `CheckAttachment(size int64) error` *(new)* — over the limit →
  `domain.ErrFileTooLarge("size", size, "limit", MaxAttachmentSize)`; any type is allowed.
- `factory.FileFactory.New(originalName, mimeType string, ownerID entity.UserID, size int64)` — the new
  argument; `UploadAvatarService` passes `int64(len(upload.Content))`.
- `entity/attachment.go` *(new)*:

  ```go
  // Attachment — a file of a task (ADR-0037); the uploader is File.OwnerID.
  type Attachment struct {
      TaskID    TaskID
      File      *File
      CreatedAt time.Time
  }

  // CheckDelete — the uploader, the project owner or a project admin deletes an attachment.
  func (a *Attachment) CheckDelete(by *ProjectMember) error { … like Comment.CheckDelete … }
  ```

- Tests: `CheckAttachment` at exactly 25 MB and one byte more; `CheckDelete` for the three allowed
  roles and a member who is not the uploader.

## Repositories

- `persistent/file.go`: `Create` writes `size`; `Get` reads it.
- `domain/repository/attachment.go` *(new)* (add to `mock` in `server/Makefile`, generate the mock):

  ```go
  // AttachmentRepository — attachments of tasks (ADR-0037). Files marked deleted are not returned.
  type AttachmentRepository interface {
      Create(ctx context.Context, a *entity.Attachment) error
      // ListByTask — newest first.
      ListByTask(ctx context.Context, taskID entity.TaskID) ([]*entity.Attachment, error)
      // Get — the attachment of this task; another task's file is ENTITY_NOT_FOUND.
      Get(ctx context.Context, taskID entity.TaskID, fileID entity.FileID) (*entity.Attachment, error)
      Delete(ctx context.Context, fileID entity.FileID) error
      // TaskOf — the task of an attachment file; nil if the file is not an attachment (an avatar).
      TaskOf(ctx context.Context, fileID entity.FileID) (*entity.TaskID, error)
  }
  ```

- `persistent/attachment.go` *(new)*: queries join `files f ON f.id = a.file_id` and filter
  `f.soft_deleted_at IS NULL AND f.deleted_at IS NULL`; `ORDER BY a.created_at DESC, a.file_id`.
  `TaskOf` — `SELECT task_id FROM task_attachments WHERE file_id = $1`, `pgx.ErrNoRows` → `nil, nil`.
- Repository tests `persistent/attachment_test.go` *(new)*: create and list two in order, `Get` of another
  task → `ENTITY_NOT_FOUND`, a soft-deleted file disappears from the list, `TaskOf` of an avatar → nil.

## Application

**Task module** (`service/task/`): `Deps` gets `AttachmentRepo`, `FileRepo`, `FileFactory`, `FileStorage`.

- `dto.Attachment { Attachment *entity.Attachment; Author *entity.UserAccount }` *(new)* in `dto/task.go`.
- `ListAttachmentsService` *(new)* — `feed.task` (membership), `ListByTask`, authors through
  `feed.people` (copy `feed.comments`).
- `UploadAttachmentService.Execute(ctx, userID, taskID string, upload dto.Upload) (*dto.Attachment, error)`
  *(new)*:
  1. `entity.CheckAttachment(int64(len(upload.Content)))`;
  2. `feed.task(ctx, userID, taskID)` — a non-member gets `404` before anything is written to disk;
  3. `mimeType := http.DetectContentType(upload.Content)`; `file := fileFactory.New(upload.Name, mimeType,
     entity.UserID(userID), int64(len(upload.Content)))`; `storage.Save(ctx, file.ID, bytes.NewReader(…))`
     outside the transaction;
  4. `e.commentChange(ctx, userID, taskID, func(ctx, task, member) error { files.Create; attachments.Create
     with CreatedAt = file.CreatedAt })` — it locks the project, checks membership and that the task and
     the project are active;
  5. on an error of step 4 — `_ = storage.Delete(ctx, file.ID)` and return the error (as `avatar.go`);
  6. return the attachment with its author (`feed.people`).
- `DeleteAttachmentService.Execute(ctx, userID, taskID, fileID string) error` *(new)* —
  `e.commentChange`: `attachments.Get(ctx, task.ID, …)`, `CheckDelete(member)`, `attachments.Delete`,
  `files.SoftDelete(ctx, fileID, now)`. The periodic cleanup erases the file later.
- Service tests (copy `TestUploadAvatarTxFailed`): the stored file is deleted when the transaction fails;
  a too large upload touches neither storage nor the database. `newModule` in `service/task/task_test.go`
  has no `FileStorage`, `FileRepo`, `AttachmentRepo` or `UserRepo` mocks yet — add them to `deps`.

**File module** (`service/file/file.go`): `Deps` gets `AttachmentRepo`, `TaskRepo`, `MemberRepo`.
`DownloadService.Execute(ctx, viewerID, id string)` — `viewerID` is empty for a guest:

```go
taskID, err := s.attachments.TaskOf(ctx, entity.FileID(id))
if err != nil { return dto.FileContent{}, err }
if taskID != nil {
    // An attachment is only for members of its task's project (ADR-0037); a guest is asked to sign in.
    if viewerID == "" { return dto.FileContent{}, domain.ErrAccessTokenNotFound() }
    task, err := s.tasks.Get(ctx, *taskID) // a deleted task — ENTITY_NOT_FOUND
    if err != nil { return dto.FileContent{}, err }
    if _, err := s.members.Get(ctx, task.ProjectID, entity.UserID(viewerID)); err != nil { return dto.FileContent{}, err }
}
… the existing Get and Open …
```

Remove the old comment about stage 3 there. In `service/file/file_test.go`, `newModule` returns only
`(module, fileRepo, storage)`: add the attachment, task and member mocks, update `TestDownload` for the new
argument and add cases — an attachment for a guest (the code of `ErrAccessTokenNotFound`), for a
non-member (`ENTITY_NOT_FOUND`), for a member.

**Wiring** `internal/app/app.go`: `attachmentRepo := persistent.NewAttachmentRepo(pool)`; the task module
gets `AttachmentRepo`, `FileRepo`, `FileFactory` (the same `factory.NewFileFactory(idGen, clk)` as the user
module — create it once), `FileStorage: storage`; the file module gets `AttachmentRepo`, `TaskRepo`,
`MemberRepo`.

## HTTP

- Middleware `NewOptionalAuth(ts service.AccessTokenService, m *contextmanager.GinContextManager)`
  *(new)* in `middleware/auth.go`: a valid `at` cookie → `m.SetUserID`; no cookie or an invalid one →
  the request goes on as a guest, the cookie is not deleted (an avatar must load anyway).
  Build it in `internal/app/app.go` next to `NewAuth` and pass it through `http.NewRouter` and
  `v1.NewRouter` to `NewFileRouter(g, modules.File, optionalAuthMW, cm)`.
- `v1/file.go`: `fileRoutes` gets `cm`; the viewer is `cm.GetUserID(c)` or `""` on its error; update the
  comment on `get`.
- `request/user.go`: extract `bindUpload(c *gin.Context, limit int64) (dto.Upload, error)` from
  `BindAvatar` (the `MaxBytesReader` limit is `limit + multipartOverhead`); `BindAvatar` calls it with
  `entity.MaxAvatarSize`; `BindAttachment(c)` *(new)* — with `entity.MaxAttachmentSize`. Keep the field
  name `file`.
- `response/attachment.go` *(new)*: `Attachment { ID, TaskID, Name, MimeType string; Size int64; Author
  User; CreatedAt time.Time }` (json `id`, `taskId`, `name`, `mimeType`, `size`, `author`, `createdAt`),
  `NewAttachment`, `NewAttachments`.
- `v1/task.go`: handlers `listAttachments`, `uploadAttachment` (`201`), `deleteAttachment` (`204`, path
  `pathID(c, "fileId")`); routes `GET/POST /tasks/:taskId/attachments`,
  `DELETE /tasks/:taskId/attachments/:fileId`.

## Contract

- Schema `Attachment` (all required): `id` Uuid — "file ID for `GET /v1/files/{fileId}`", `taskId`, `name`
  (string), `mimeType` (string, "detected from the content, may carry parameters like `charset`"), `size`
  (integer ≥ 0, bytes), `author: User`, `createdAt`.
- `/v1/tasks/{taskId}/attachments`: `get` `listTaskAttachments` (`200 Attachment[]`, 401, 404, 500);
  `post` `uploadTaskAttachment` — multipart like `uploadAvatar` (`file`), description "any type up to
  25 MB (ADR-0037)"; `201 Attachment`, 401, 404, `409 TaskReadOnly`, `422` `FILE_TOO_LARGE` or
  `VALIDATION_FAILED`, 500.
- `/v1/tasks/{taskId}/attachments/{fileId}`: `delete` `deleteTaskAttachment` — `204`, 401, 403, 404,
  `409 TaskReadOnly`, 500.
- `getFile`: description — an attachment needs a session of a member of its project; add
  `401 Unauthenticated` ("an attachment without a valid session").

## Stack proxy

`stand/nginx.conf.template`: `client_max_body_size 25664k;` (25 MB + 64 KB) for `/api/`; update the comment —
it now follows `entity.MaxAttachmentSize` and `multipartOverhead`; the avatar limit is checked by the
server. Update the comment of `multipartOverhead` in `request/user.go` too.

## Handler tests — `v1/attachment_test.go` *(new)*

Use `apitest.Multipart{{Name: "file", FileName: "notes.txt", Content: []byte("hello")}}` and `pngImage(t)`.

- Upload a text file and a PNG → `201`; `mimeType` `text/plain; charset=utf-8` and `image/png`, `size`,
  `author` is the uploader; the list is newest first.
- `GET /v1/files/{id}`: a member → `200`, `Content-Disposition: attachment; filename=notes.txt` for the
  text and `inline; filename=<name>` for the PNG (the handler uses `mime.FormatMediaType`); a guest (`anonymous(t, s)`) → `401`; a user of another project
  (`session(t, s, …)` of `admin_test.go`) → `404`; after the task is deleted → `404`.
- Exactly 25 MB → `201`; one byte more → `422 FILE_TOO_LARGE`, and `filesOnDisk` has no new file.
- Delete: another member → `403`; the uploader → `204`; then `GET /v1/files/{id}` → `404`;
  `s.App.File.Cleanup.Execute` erases it from disk. The project owner deletes another's attachment →
  `204`.
- An archived task → `409` on upload and delete; a file of another task in the path → `404`; a non-member
  → `404` on list and upload.
- A moved task keeps its attachments.
- The avatar still rejects 5 MB + 1 byte (`TestAvatarRejected` must stay green).

## Web types

`npm run api:types`. Nothing else in the web.

## Stack

Smoke: upload a small text file to the smoke task as the member, list it, download it through
`/api/v1/files/{id}` with the member's session (the same bytes), delete it.

## Docs

`server/README.md` «Files»: attachments, the 25 MB limit, members-only serving, the proxy limit.

## Done when

Common criteria from the stage README.

## Show the customer

Swagger: upload an attachment, the list, download as a member, `401` as a guest, deletion rules,
`422` for a too large file; the tests and the `scripts/dev.sh check` output.
