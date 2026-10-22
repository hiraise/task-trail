import type { ProjectId, TaskId, TaskStatusId, UserId } from "../types";

export interface Task {
  id: TaskId;
  projectId: ProjectId;
  name: string;
  /** Описания нет — undefined */
  description?: string;
  statusId: TaskStatusId;
  authorId: UserId;
  /** Исполнителя нет — undefined; исполнитель всегда участник проекта задачи */
  assigneeId?: UserId;
  /** ISO 8601 в UTC */
  createdAt: string;
  /** ISO 8601 в UTC */
  updatedAt: string;
}
