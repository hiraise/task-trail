import type { TaskId, TaskPriorityId, TaskStatusId } from "../types";

import type { User } from "./User";

/** What changed in a task (ADR-0028); the set is fixed. */
export type TaskEventKind =
  | "created"
  | "edited"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "assignee_changed"
  | "moved"
  | "archived"
  | "restored"
  | "parent_changed";

/**
 * A row of task history. Change fields are set only by the kinds that use them:
 * `status_changed` — statuses, `priority_changed` — priorities,
 * `due_date_changed` — days `YYYY-MM-DD` (undefined — no due date), `assignee_changed` — users (undefined — no assignee), `moved` — keys,
 * `parent_changed` — the keys of the old and the new parent (undefined — no parent, ADR-0036).
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
  fromPriority?: TaskPriorityId;
  toPriority?: TaskPriorityId;
  fromDueDate?: string;
  toDueDate?: string;
  fromUser?: User;
  toUser?: User;
  fromKey?: string;
  toKey?: string;
}
