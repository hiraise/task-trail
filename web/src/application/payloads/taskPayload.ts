import type { ProjectId, TaskId, UserId } from "@/domain/types";

export interface CreateTaskPayload {
  name: string;
  description?: string;
  assigneeId: UserId | undefined;
  projectId: ProjectId;
}

export interface EditTaskPayload {
  taskId: TaskId;
  title: string;
  description?: string;
}

export interface ChangeAssigneePayload {
  taskId: TaskId;
  assigneeId?: UserId;
}

export interface ChangeStatusPayload {
  taskId: TaskId;
  statusId: string;
}

export interface UpdateTaskPayload {
  name?: string;
  description?: string;
}
