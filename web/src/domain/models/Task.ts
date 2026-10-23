import type { Label } from "./Label";
import type { ProjectId, TaskId, TaskPriorityId, TaskStatusId, UserId } from "../types";

export interface Task {
  id: TaskId;
  projectId: ProjectId;
  /** Sequential within the project */
  number: number;
  /** Like DS-12; changes with the project key and on a move */
  key: string;
  name: string;
  /** undefined when there is no description */
  description?: string;
  statusId: TaskStatusId;
  priority: TaskPriorityId;
  /** A calendar day YYYY-MM-DD; undefined — no due date (ADR-0034) */
  dueDate?: string;
  authorId: UserId;
  /** undefined when unassigned; the assignee is always a member of the task's project */
  assigneeId?: UserId;
  /** ISO 8601 in UTC; undefined when the task is not archived on its own (ADR-0027) */
  archivedAt?: string;
  /** Labels of the task's project, ordered by name (ADR-0035) */
  labels: Label[];
  /** The parent task in the same project; undefined — not a subtask. One level (ADR-0036) */
  parentId?: TaskId;
  /** Non-archived subtasks */
  subtasksTotal: number;
  /** Non-archived subtasks in a resolved status */
  subtasksDone: number;
  /** The task's project is archived: the task is read-only too */
  projectArchived: boolean;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
}

/** The task is read-only: archived on its own or together with its project (ADR-0027). */
export const isTaskArchived = (task: Task): boolean =>
  task.archivedAt !== undefined || task.projectArchived;
