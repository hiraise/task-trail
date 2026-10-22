import type { Task } from "../models/Task";
import type { TaskStatus } from "../models/TaskStatus";
import type { ProjectId, TaskId, TaskStatusId, UserId } from "../types";

export interface NewTask {
  projectId: ProjectId;
  name: string;
  description?: string;
  /** The assignee is a project member */
  assigneeId?: UserId;
}

export interface TaskChanges {
  name?: string;
  /** null removes the description */
  description?: string | null;
}

// Each task operation has its own method and endpoint (ADR-0002); the server responds with the task.
export interface TaskRepository {
  findById(id: TaskId): Promise<Task>;
  findByProjectId(projectId: ProjectId): Promise<Task[]>;
  /** Tasks assigned to the current user across all their projects */
  findAssignedToMe(): Promise<Task[]>;
  /** Statuses in workflow order */
  findStatuses(): Promise<TaskStatus[]>;
  create(task: NewTask): Promise<Task>;
  update(id: TaskId, changes: TaskChanges): Promise<Task>;
  changeStatus(id: TaskId, statusId: TaskStatusId): Promise<Task>;
  /** null unassigns the task */
  changeAssignee(id: TaskId, assigneeId: UserId | null): Promise<Task>;
  /** Moves to another project; if the assignee is not a member of the new project, the task is unassigned */
  move(id: TaskId, projectId: ProjectId): Promise<Task>;
  delete(id: TaskId): Promise<void>;
}
