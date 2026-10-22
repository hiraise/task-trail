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
  /** null — снять исполнителя */
  assigneeId: UserId | null;
}

export interface MoveTaskPayload {
  /** Задача до переноса: по ней видно, снял ли сервер исполнителя */
  task: Task;
  /** Проект, куда переносим */
  project: Project;
}
