import type { Project } from "@/domain/models/Project";
import type { Task } from "@/domain/models/Task";
import type { NewTask, TaskChanges } from "@/domain/repositories/TaskRepository";
import type { LabelId, TaskId, TaskPriorityId, TaskStatusId, UserId } from "@/domain/types";

export type CreateTaskPayload = NewTask;

export interface EditTaskPayload extends TaskChanges {
  taskId: TaskId;
}

export interface ChangeTaskStatusPayload {
  taskId: TaskId;
  statusId: TaskStatusId;
}

export interface ChangeTaskPriorityPayload {
  taskId: TaskId;
  priority: TaskPriorityId;
}

export interface ChangeTaskDueDatePayload {
  taskId: TaskId;
  /** YYYY-MM-DD; null removes the due date */
  dueDate: string | null;
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

export interface SetTaskLabelsPayload {
  taskId: TaskId;
  /** The new set: 0–10 labels of the task's project (ADR-0035) */
  labelIds: LabelId[];
}
