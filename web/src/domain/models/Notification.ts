import type { TaskId, TaskStatusId } from "../types";

import type { User } from "./User";

/** What happened (ADR-0038); `mentioned` comes from a comment mention (ADR-0039). */
export type NotificationKind =
  | "assigned"
  | "status_changed"
  | "commented"
  | "mentioned"
  | "due_soon"
  | "overdue";

/**
 * A notification of the current user about a task. Change fields are set only for the kinds that
 * use them: `status_changed` — statuses, `commented`/`mentioned` — `text`, reminders — `dueDate`.
 */
export interface Notification {
  id: string;
  kind: NotificationKind;
  task: { id: TaskId; key: string; name: string };
  /** Undefined for due date reminders */
  actor?: User;
  createdAt: string;
  /** Undefined — unread */
  readAt?: string;
  fromStatusId?: TaskStatusId;
  toStatusId?: TaskStatusId;
  /** The start of the comment */
  text?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
}
