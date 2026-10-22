import type { Project } from "@/domain/models/Project";
import type { Task } from "@/domain/models/Task";
import type { NewTask, TaskChanges } from "@/domain/repositories/TaskRepository";
import type { TaskId, TaskStatusId, UserId } from "@/domain/types";

export type CreateTaskPayload = NewTask;

export interface EditTaskPayload extends TaskChanges {
  taskId: TaskId;
}

export interface ChangeTaskStatusPayload {
  taskId: TaskId;
  statusId: TaskStatusId;
}

export interface ChangeTaskAssigneePayload {
  taskId: TaskId;
  /** null unassigns the task */
  assigneeId: UserId | null;
}

export interface MoveTaskPayload {
  /** The task before the move: shows whether the server removed the assignee */
  task: Task;
  /** The target project */
  project: Project;
}
