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
  /** The project's tasks by their own archive flag (ADR-0027) */
  findByProjectId(projectId: ProjectId, archived: boolean): Promise<Task[]>;
  /**
   * Tasks assigned to the current user across all their projects. Active: neither the task nor its
   * project is archived; archived: either is (ADR-0027).
   */
  findAssignedToMe(archived: boolean): Promise<Task[]>;
  /** Statuses in workflow order */
  findStatuses(): Promise<TaskStatus[]>;
  create(task: NewTask): Promise<Task>;
  update(id: TaskId, changes: TaskChanges): Promise<Task>;
  changeStatus(id: TaskId, statusId: TaskStatusId): Promise<Task>;
  /** null unassigns the task */
  changeAssignee(id: TaskId, assigneeId: UserId | null): Promise<Task>;
  /** Moves to another project; if the assignee is not a member of the new project, the task is unassigned */
  move(id: TaskId, projectId: ProjectId): Promise<Task>;
  /** Archives (true) or restores (false) a task; any member of its active project */
  setArchived(id: TaskId, archived: boolean): Promise<Task>;
  delete(id: TaskId): Promise<void>;
}
