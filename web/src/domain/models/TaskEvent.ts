import type { TaskId, TaskStatusId } from "../types";

import type { User } from "./User";

/** What changed in a task (ADR-0028); the set is fixed. */
export type TaskEventKind =
  | "created"
  | "edited"
  | "status_changed"
  | "assignee_changed"
  | "moved"
  | "archived"
  | "restored";

/**
 * A row of task history. Change fields are set only by the kinds that use them:
 * `status_changed` — statuses, `assignee_changed` — users (undefined — no assignee), `moved` — keys.
 */
export interface TaskEvent {
  id: string;
  taskId: TaskId;
  kind: TaskEventKind;
  actor: User;
  /** ISO 8601 in UTC */
  createdAt: string;
  fromStatusId?: TaskStatusId;
  toStatusId?: TaskStatusId;
  fromUser?: User;
  toUser?: User;
  fromKey?: string;
  toKey?: string;
}
