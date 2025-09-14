import { Task, TaskStatus } from "@/domain/task/task.entity";
import { formatDate } from "@/shared/utils/formatters";

export interface ApiTask {
  assigneeId?: number;
  authorId: number;
  createdAt: string;
  description?: string;
  id: number;
  name: string;
  statusId: number;
  updatedAt: string;
  projectId: number;
}

export interface ApiStatus {
  id: number;
  isDefault: boolean;
  isResolved: boolean;
  name: string;
}

export const mapProjectTasksFromApi = (apiTask: ApiTask): Task => {
  return {
    assigneeId: apiTask.assigneeId,
    authorId: apiTask.authorId,
    createdAt: formatDate(apiTask.createdAt),
    description: apiTask.description ?? "",
    id: apiTask.id,
    title: apiTask.name,
    statusId: apiTask.statusId,
    updatedAt: formatDate(apiTask.updatedAt),
    projectId: apiTask.projectId,
  };
};

export const mapTaskStatus = (apiStatus: ApiStatus): TaskStatus => {
  return {
    id: apiStatus.id,
    isDefault: apiStatus.isDefault,
    isResolved: apiStatus.isResolved,
    name: apiStatus.name,
  };
};
