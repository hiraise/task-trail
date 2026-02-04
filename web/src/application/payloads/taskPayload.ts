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
  /**
   * Task ID is used for routing (endpoint URL),
   * NOT included in request body
   */
  taskId: TaskId;
  name?: string;
  description?: string;
}
