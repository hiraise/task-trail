# Step 11 — attachments in the web

Read first: [ADR-0037](../../adr/0037-task-attachments.md), the stage [README](README.md), artboards B, I
and «Approved values» in [00-mockups.md](00-mockups.md). Step 10 must be merged. The avatar upload is the
template: `apiUserRepository.uploadAvatar` (`FormData`, field `file`),
`application/usecases/user/UploadAvatarUseCase.ts` (the size check before sending),
`features/user/hooks/useUploadAvatar.ts`, `presentation/shared/hooks/useSelectImage.ts`. Names marked
*(new)* do not exist yet.

## Model, mapper, repository

- `web/src/domain/models/Attachment.ts` *(new)*:

  ```ts
  export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // ADR-0037, the same as the server
  export interface Attachment {
    id: string;          // the file ID for GET /v1/files/{fileId}
    taskId: TaskId;
    name: string;
    mimeType: string;
    size: number;        // bytes
    author: User;
    createdAt: string;   // ISO 8601 UTC
  }
  /** JPEG, PNG and WebP are shown as previews; the server serves them inline (ADR-0013). */
  export const isImageAttachment = (a: Attachment) => ["image/jpeg", "image/png", "image/webp"].includes(a.mimeType);
  ```

- `toAttachment` *(new)* in `mappers.ts` (`author` through `toUser`), test in `mappers.test.ts`.
- `TaskRepository` *(new methods)*: `findAttachments(id)`, `uploadAttachment(id, file: File)` (`FormData`,
  `"Content-Type": "multipart/form-data"`, like `uploadAvatar`), `deleteAttachment(id, fileId)`;
  routes `TASK_ATTACHMENTS(id)`, `TASK_ATTACHMENT(id, fileId)`.
- `FileRepository` *(new)* in `domain/repositories/` with `download(fileId): Promise<Blob>`;
  `apiFileRepository.ts` — `http.get<Blob>(API_ROUTES.FILE(fileId), { responseType: "blob", timeout:
  FILE_TRANSFER_TIMEOUT_MS })`. The axios client refreshes an expired session on `401` and retries, which
  a plain link cannot do (ADR-0037). With `responseType: "blob"` an error body is a `Blob`, so the
  `ApiError` code is lost: the hook shows `downloadFailed` for any error — that is expected.
- Timeouts: `AxiosHttpClient` uses a global 5-second `REQUEST_TIMEOUT_MS`; a 25 MB transfer needs more.
  Add `FILE_TRANSFER_TIMEOUT_MS = 120_000` to `infrastructure/http/timeouts.ts` (with a comment) and
  pass `{ timeout: FILE_TRANSFER_TIMEOUT_MS }` in `uploadAttachment` and `download`.
- `QUERY_KEYS.task.attachments(id)` = `["task", id, "attachments"]`.

## Helpers

- `formatFileSize(bytes)` *(new)* in `shared/utils/formatters.ts`: «512 Б», «2,4 КБ», «2,4 МБ» (one
  decimal, a comma, no decimal for bytes); tests.
- `saveBlob(blob: Blob, name: string)` *(new)* in `shared/utils/saveBlob.ts`: `URL.createObjectURL`, a
  temporary `<a download={name}>`, `click()`, `URL.revokeObjectURL` after the click.

## Texts

`tasksTexts`: `attachments: "Вложения"`, `addFile: "Добавить файл"`, `uploading: "Загружаем…"`,
`noAttachments: "Файлов пока нет"`, `download: "Скачать"`, `deleteAttachment: "Удалить"`,
`deleteAttachmentTitle: "Удалить файл «{name}»?"`, `deleteAttachmentDescription: "Файл пропадёт из
задачи."`, `attachmentTooLarge: "Файл «{name}» больше 25 МБ"`, `uploadFailed: "Не удалось загрузить
«{name}»"`, `downloadFailed: "Не удалось скачать файл"`, `deleteAttachmentFailed: "Не удалось удалить
файл"`, `attachmentDeleted: "Файл удалён"`.
`apiErrorTexts.FILE_TOO_LARGE` becomes neutral: «Файл слишком большой». The avatar takes its text from
there today (`UploadAvatarUseCase` throws `AppError` with the code, `useUploadAvatar` calls `toastError`),
so keep its limit visible: add `TEXTS.profile.avatarTooLarge: "Файл больше 5 МБ"` and in
`useUploadAvatar.onError` show it when `hasErrorCode(error, "FILE_TOO_LARGE")`, otherwise `toastError` as
now.

## Icons

`ICONS.paperclip`, `ICONS.file`, `ICONS.download` from «Approved values».

## Hooks (`features/tasks/hooks/`)

- `useTaskAttachments(taskId)` — `useQuery`.
- `useUploadAttachments()` — a mutation over a `File[]`: files bigger than `MAX_ATTACHMENT_SIZE` are not
  sent, each gets the toast `attachmentTooLarge`; the rest are uploaded one by one; a failed one gets
  `toastError(error, uploadFailed)` and the others continue; at the end invalidate
  `task.attachments(taskId)`. Return `isPending` for the «Загружаем…» state.
- `useDeleteAttachment()` — invalidate `task.attachments(taskId)`, `toast.success(attachmentDeleted)`.
- `useDownloadAttachment()` — `fileRepository.download(id)` then `saveBlob(blob, attachment.name)`;
  `toastError(error, downloadFailed)`.

## Component `TaskAttachments` *(new)*

`features/tasks/components/TaskAttachments/` (`.tsx`, `.module.css`, `AttachmentItem.tsx`, test). Props
`{ task: Task; role: ProjectRole; readOnly: boolean }`.

- Header: `h4` «Вложения» and, when not `readOnly`, `SubmitButton text` with `ICONS.paperclip`
  «Добавить файл»; it opens a hidden `<input type="file" multiple>` — like `useSelectImage`, but take
  every file of `e.target.files` and reset the input value after reading. While uploading —
  «Загружаем…» and the button disabled.
- `AttachmentItem`: an image — a 48×48 preview `<img src={fileUrl(id)} alt={name}>` (`object-fit: cover`,
  radius 8); another file — `ICONS.file` in a 48×48 `--bg-secondary` square; the name (one line,
  ellipsis), `formatFileSize(size) · author name · formatDate(createdAt)` in `caption-reg`
  `--text-secondary`. A click on the row downloads; the «…» trigger is inside the row, so wrap it in an
  element that calls `event.stopPropagation()` on click. A `DropdownMenu` «…»: «Скачать» always; «Удалить» when
  not `readOnly` and the user is the author or `canDeleteComment(role, isAuthor)` allows it (the same
  rule: author, owner, admin) → `showConfirm` → `useDeleteAttachment`.
- Empty — `noAttachments`.
- Previews load right after the list (the list request refreshes the session first, ADR-0037).
- Test: an image row shows `<img>`, a text file shows the icon; «Удалить» is hidden for another member;
  a file over 25 MB is not sent (mock the repository).

## Placement

Render `<TaskAttachments task={data.task} role={data.project.role} readOnly={isTaskArchived(data.task)} />`
after `TaskSubtasks` in `TaskPage.tsx` (its own `<section>`) and in `TaskModal.tsx` (the same props from
its `useTaskDetail` data).

## Stack

On the stack: upload a PNG and a PDF to a task (preview and icon), download both, delete as the uploader;
as another member — no «Удалить» on someone else's file; a 30 MB file — the toast without a request;
an archived task — no «Добавить файл».

## Done when

Common criteria from the stage README; `formatFileSize` and `saveBlob` are tested.

## Show the customer

The attachments block on a phone, a desktop and in the kanban modal: upload of several files, previews,
download, delete with the confirmation, the too-large message.
