import type { Task } from "@/domain/models/Task";

export interface TaskResponseDto {
  id: number;
  title: string;
  description?: string;
  statusId: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  authorId: number;
  assigneeId?: number;
}

/**
 * Maps a Task domain entity to a TaskResponseDto for API responses.
 *
 * @param task - The Task domain entity to be mapped
 * @returns A TaskResponseDto object containing the task data in response format
 *
 * @remarks
 * This function performs the following transformations:
 * - Converts task ID from domain value object to number
 * - Converts createdAt and updatedAt dates to string representation
 * - Converts projectId to number
 * - Transfers other properties (title, description, statusId, authorId, assigneeId) directly
 */
export const mapTaskToResponse = (task: Task): TaskResponseDto => {
  return {
    id: Number(task.id.value),
    title: task.title,
    description: task.description,
    statusId: task.statusId,
    createdAt: task.createdAt.toString(),
    updatedAt: task.updatedAt.toString(),
    projectId: Number(task.projectId),
    authorId: task.authorId,
    assigneeId: task.assigneeId,
  };
};

export const mapTasksToResponse = (tasks: Task[]): TaskResponseDto[] =>
  tasks.map((task) => mapTaskToResponse(task));
