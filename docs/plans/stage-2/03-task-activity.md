# Step 3 — task activity: comments and history

Read first: [ADR-0028](../../adr/0028-task-activity-feed.md), [ADR-0027](../../adr/0027-reversible-archive.md)
(archive rules for comments), the stage [README](README.md). Steps 1 and 2 must be merged.

## Migration `000008_task_activity`

- Table `task_comments`: `id UUID PRIMARY KEY`, `seq BIGINT GENERATED ALWAYS AS IDENTITY`,
  `task_id UUID NOT NULL REFERENCES tasks(id)`, `author_id UUID NOT NULL REFERENCES users(id)`,
  `text VARCHAR(10000) NOT NULL`, `created_at TIMESTAMPTZ NOT NULL`, `edited_at TIMESTAMPTZ`;
  index `(task_id, created_at DESC, seq DESC)`.
- Table `task_events`: `id UUID PRIMARY KEY`, `seq BIGINT GENERATED ALWAYS AS IDENTITY`,
  `task_id UUID NOT NULL REFERENCES tasks(id)`, `actor_id UUID NOT NULL REFERENCES users(id)`,
  `kind VARCHAR NOT NULL`, `data JSONB NOT NULL DEFAULT '{}'`, `created_at TIMESTAMPTZ NOT NULL`;
  index `(task_id, created_at DESC, seq DESC)`.
- A `created` event for every existing task, in task creation order:
  `INSERT … SELECT gen_random_uuid(), id, author_id, 'created', '{}', created_at FROM tasks
  ORDER BY created_at, id`.
- `seq` only orders rows with equal time; the API does not return it.

## Domain

- `entity.Comment` *(new)*: `ID`, `TaskID`, `AuthorID`, `Text`, `CreatedAt`, `EditedAt *time.Time`.
  Constant `CommentEditWindow = 24 * time.Hour`.
- `Comment.Edit(by, text, now)`: not the author → `FORBIDDEN`; editing is allowed only while
  `now.Before(c.CreatedAt.Add(CommentEditWindow))`, so exactly 24 hours later it is already
  `COMMENT_EDIT_EXPIRED`.
- `Comment.CheckDelete(by *ProjectMember)`: the author, the project owner or a project admin.
- `entity.TaskEvent` *(new)*: `ID`, `TaskID`, `ActorID`, `Kind`, `CreatedAt` and change fields —
  pointers `FromStatus`/`ToStatus`, `FromUser`/`ToUser`, `FromKey`/`ToKey`. `data` stores only the
  fields that are set. Kinds are constants from the ADR.
- `CommentFactory` *(new)* takes the ID from the generator and time from `Clock`.
  `TaskEventFactory` *(new)* takes the ID from the generator and `now` as an argument: the event gets
  exactly the time of the change it records.
- Error code `COMMENT_EDIT_EXPIRED` → `409` — six places (stage README). Russian text:
  «Комментарий можно изменить только в первые 24 часа».

## Repositories

- `CommentRepository` *(new)*: `Create`, `Get`, `ListByTask` (`ORDER BY created_at DESC, seq DESC`),
  `Update` (text and `edited_at`), `Delete`.
- `TaskEventRepository` *(new)*: `Create`, `ListByTask` (same order).
- `UserRepository.ListByIDs` *(new)* — users for a response in one query.
- `TaskRepository.UnassignInProject` returns the IDs of tasks whose assignee was removed
  (`RETURNING id`), archived tasks included.
- Add the new interface files to the `mock` target in `server/Makefile` and generate mocks.

## Application services

- Every operation of the `task` module writes an event in its transaction, with the `now` of the
  change, only if the value changed:
  - `Create` — `created`;
  - `Update` — one `edited` per request if the name or description changed;
  - `ChangeStatus` — `status_changed`;
  - `ChangeAssignee` — `assignee_changed`;
  - `Move` — `moved`, plus `assignee_changed` if the assignee was removed;
  - `SetTaskArchived` — `archived` or `restored`.
- In the `project` module, `RemoveMember` and `Leave` write `assignee_changed` (to `null`) for every
  task returned by `UnassignInProject`, archived tasks included. The actor is whoever removed the
  member or left.
- New services `ListComments`, `CreateComment`, `EditComment`, `DeleteComment`, `ListEvents`:
  - comment changes call `editor.lock` and check `RequireActive()` of the project and the task
    (ADR-0027);
  - a comment whose `TaskID` differs from `taskId` in the path → `404`;
  - reading is for members of the task's project; others get `404`.
- The `apitest` clock is fixed, so several events of one request share a time; `seq` keeps their
  order. Tests that check order across requests call `Clock.Advance`.

## Contract

- `TaskComment { id, taskId, author: User, text, createdAt, editedAt }` — `editedAt` required,
  nullable.
- `CreateCommentRequest` and `UpdateCommentRequest { text }` — string, 1–10 000 characters.
  The server trims spaces in the request's `normalize()`, which runs before the
  `required,max=10000` tags.
- `TaskEventKind` — enum of event kinds.
- `TaskEvent { id, taskId, kind, actor: User, createdAt, fromStatusId, toStatusId, fromUser, toUser,
  fromKey, toKey }`. Change fields are always present and `null` when the kind has none
  (ADR-0018). The schema description says which fields each kind uses.
- Operations `listTaskComments`, `createTaskComment` (`201`), `updateTaskComment` (`200`),
  `deleteTaskComment` (`204`), `listTaskEvents`.
- `409` with `COMMENT_EDIT_EXPIRED`, `TASK_ARCHIVED`, `PROJECT_ARCHIVED` where they apply.

## Tests

- Entities: the edit window at exactly 24 hours and one second before (`test/clock`), delete
  permissions.
- Handlers:
  - permissions and codes of every operation; `409` on an archived task;
  - a comment of another task in the path → `404`;
  - every task operation writes its event and writes nothing without a change (same status);
  - a move writes `moved` and `assignee_changed` in that order;
  - leaving and removal write `assignee_changed`, also for archived tasks;
  - list order.

## Web — data

- Models `TaskComment` (replace the stub in `domain/models/TaskComment.ts`) and `TaskEvent` *(new)*;
  mappers with tests.
- Task repository methods and cache keys `task.comments(id)` and `task.events(id)` *(new)*.
- `storeTask` in `taskCache.ts` also refetches `task.events(task.id)`.
- After a comment is created, edited or deleted, refetch `task.comments(id)`.
- After leaving a project or removing a member, refetch the `["task"]` prefix: assignees and events
  of many tasks changed.

## Web — the feed

`TaskActivity` *(new)* replaces `Comments`; delete the mocks in `Comments.mocks.ts`.

- Comments and events in one list by `createdAt`, newest on top; with equal time a comment goes
  above an event.
- **Input** — `CommentInput` as today: buttons appear after the first character, «Отправить» sends,
  the field clears after the response. Frames `1161:73155`, `1161:74167`, `1161:74388`.
- **Comment** — frames `1152:75644` and `1581:76985`:
  - avatar, name, date, «изменено» when `editedAt` is set;
  - text with clickable links: `linkify` *(new)* in `shared/utils/linkify.ts` turns `http(s)://…`
    into `<a target="_blank" rel="noopener noreferrer">`, with a test;
  - menu «…»: «Редактировать» for the author during the first 24 hours (frames `1161:75166`,
    `1892:103244`);
  - «Удалить» for the author, the project owner and project admins, with the confirmation
    «Вы действительно хотите удалить комментарий? Отменить это действие будет невозможно.»
    (frame `1581:77269`);
  - no items — no «…» button.
- **Event** — a grey line (`--text-secondary`) with avatar and date, no menu:
  - «Задача создана»;
  - «Открыта → В работе» — names from `useTaskStatuses`;
  - «Ответственный: Анна → Пётр», «Назначен ответственный: Пётр», «Ответственный снят»;
  - «Перенесена: DS-5 → CM-12»;
  - «Изменено название или описание»;
  - «Задача перемещена в архив», «Задача возвращена из архива».

## Stack

Smoke writes, edits and deletes a comment and checks the `created` and `status_changed` events.

## Done when

Common criteria from the stage README.

## Show the customer

The feed with comments and events, editing and deleting, the 24-hour window.
