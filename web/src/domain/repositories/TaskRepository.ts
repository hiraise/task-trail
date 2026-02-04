import type { Task } from "../models/Task";
import type { ProjectId, TaskId, TaskStatusId, UserId } from "../types";

export interface TaskRepository {
  findById(id: TaskId): Promise<Task>;
  findAll(): Promise<Task[]>;
  findByProjectId(projectId: ProjectId): Promise<Task[]>;
  create(data: {
    name: string;
    description?: string;
    assigneeId?: UserId;
    projectId: ProjectId;
  }): Promise<TaskId>;
  update(data: { taskId: TaskId; name?: string; description?: string }): Promise<Task>;
  delete(id: TaskId): Promise<void>;
  changeAssignee({ taskId, assigneeId }: { taskId: TaskId; assigneeId?: UserId }): Promise<Task>;
  changeStatus({ taskId, statusId }: { taskId: TaskId; statusId: TaskStatusId }): Promise<Task>;
}
