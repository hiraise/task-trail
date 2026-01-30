import type { ProjectId, TaskId, UserId } from "@/domain/types";

export type CreateTaskPayload = {
  name: string;
  description?: string;
  assigneeId: UserId | undefined;
  projectId: ProjectId;
};

export type EditTaskPayload = {
  taskId: TaskId;
  title: string;
  description?: string;
};

export type ChangeAssigneePayload = {
  taskId: TaskId;
  assigneeId?: UserId;
};

export type ChangeStatusPayload = {
  taskId: TaskId;
  statusId: string;
};

export type UpdateTaskPayload = {
  name?: string;
  description?: string;
};
