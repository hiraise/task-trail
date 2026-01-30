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
  update(task: Task): Promise<Task>;
  delete(id: TaskId): Promise<void>;
  changeAssignee(task: Task, assigneeId: UserId): Promise<Task>;
  changeStatus(task: Task, statusId: TaskStatusId): Promise<Task>;
}
