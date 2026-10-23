import type { ProjectId, TaskId, TaskStatusId, UserId } from "../types";

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
  authorId: UserId;
  /** undefined when unassigned; the assignee is always a member of the task's project */
  assigneeId?: UserId;
  /** ISO 8601 in UTC */
  createdAt: string;
  /** ISO 8601 in UTC */
  updatedAt: string;
}
