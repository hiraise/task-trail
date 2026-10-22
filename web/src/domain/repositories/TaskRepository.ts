import type { Task } from "../models/Task";
import type { TaskStatus } from "../models/TaskStatus";
import type { ProjectId, TaskId, TaskStatusId, UserId } from "../types";

export interface NewTask {
  projectId: ProjectId;
  name: string;
  description?: string;
  /** Исполнитель — участник проекта */
  assigneeId?: UserId;
}

export interface TaskChanges {
  name?: string;
  /** null — убрать описание */
  description?: string | null;
}

// Каждая операция с задачей — свой метод и свой эндпоинт (ADR-0002); сервер отвечает задачей.
export interface TaskRepository {
  findById(id: TaskId): Promise<Task>;
  findByProjectId(projectId: ProjectId): Promise<Task[]>;
  /** Задачи, назначенные на текущего пользователя, во всех его проектах */
  findAssignedToMe(): Promise<Task[]>;
  /** Статусы в порядке работы над задачей */
  findStatuses(): Promise<TaskStatus[]>;
  create(task: NewTask): Promise<Task>;
  update(id: TaskId, changes: TaskChanges): Promise<Task>;
  changeStatus(id: TaskId, statusId: TaskStatusId): Promise<Task>;
  /** null — снять исполнителя */
  changeAssignee(id: TaskId, assigneeId: UserId | null): Promise<Task>;
  /** Перенос в другой проект; исполнитель не участник нового проекта — задача без исполнителя */
  move(id: TaskId, projectId: ProjectId): Promise<Task>;
  delete(id: TaskId): Promise<void>;
}
