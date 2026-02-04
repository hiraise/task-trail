import type {
  ChangeAssigneePayload,
  ChangeStatusPayload,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "@/application/payloads";
import { createTask, type Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { ProjectId, TaskId } from "@/domain/types";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

const handleError = (message: string, error: unknown): AppError => {
  if (error instanceof AppError) return error;

  return new AppError(AppErrorType.SERVER, message);
};

const createTaskRepository = (httpClient: HttpClient): TaskRepository => ({
  /**
   * Changes the assignee of the specified task to the given user.
   *
   * @param payload - The payload containing taskId and assigneeId.
   * @returns A promise that resolves to the updated Task object.
   * @throws Throws an error if the assignee change fails.
   */
  changeAssignee: async (payload: ChangeAssigneePayload): Promise<Task> => {
    try {
      const { taskId, assigneeId } = payload;
      const dto = await httpClient.patch(API_ROUTES.CHANGE_ASSIGNEE(taskId, assigneeId), payload);

      return createTask(dto);
    } catch (error) {
      throw handleError("Failed to change assignee", error);
    }
  },

  /**
   * Changes the status of the specified task to the given status ID.
   *
   * @param payload - The payload containing taskId and statusId.
   * @returns A promise that resolves to the updated Task object.
   * @throws Will throw an error if the status change fails.
   */
  changeStatus: async (payload: ChangeStatusPayload): Promise<Task> => {
    try {
      const { taskId, statusId } = payload;
      const dto = await httpClient.patch(API_ROUTES.CHANGE_STATUS(taskId, statusId));

      return createTask(dto);
    } catch (error) {
      throw handleError("Failed to change status", error);
    }
  },

  /**
   * Retrieves a list of tasks associated with a specific project by its ID.
   *
   * @param projectId - The unique identifier of the project whose tasks are to be fetched.
   * @returns A promise that resolves to an array of `Task` objects belonging to the specified project.
   * @throws {AppError} Throws an error if the server response is invalid or if the request fails.
   */
  findByProjectId: async (projectId: ProjectId): Promise<Task[]> => {
    try {
      const dtos = await httpClient.get(API_ROUTES.PROJECT_TASKS(projectId));

      if (!dtos || dtos.length === 0) return [];

      return dtos.map(createTask);
    } catch (error) {
      throw handleError("Failed to get tasks by project ID", error);
    }
  },

  /**
   * Retrieves a task by its unique identifier.
   *
   * @param id - The unique identifier of the task to retrieve.
   * @returns A promise that resolves to the found {@link Task} domain object.
   * @throws {AppError} Throws an error of type {@link AppErrorType.SERVER} if the task cannot be fetched.
   */
  findById: async (id: TaskId): Promise<Task> => {
    try {
      const dto = await httpClient.get(API_ROUTES.TASKS_BY_ID(id));

      return createTask(dto);
    } catch (error) {
      throw new AppError(AppErrorType.SERVER, "Failed to fetch task");
    }
  },

  /**
   * Retrieves all tasks for the current user from the API.
   *
   * @returns {Promise<Task[]>} A promise that resolves to an array of Task domain objects.
   * @throws {AppError} Throws an AppError if the response format is invalid or if the request fails.
   *
   * @example
   * const tasks = await apiTaskRepository.findAll();
   */
  findAll: async (): Promise<Task[]> => {
    try {
      const dtos = await httpClient.get(API_ROUTES.USER_TASKS);

      if (!dtos || dtos.length === 0) return [];

      return dtos.map(createTask);
    } catch (error) {
      throw new AppError(AppErrorType.UNKNOWN, "Failed to get user tasks");
    }
  },

  /**
   * Creates a new task with the specified data.
   *
   * @param data - The data required to create a task, including the task name, optional description, optional assignee ID, and project ID.
   * @returns A promise that resolves to the unique identifier (`TaskId`) of the newly created task.
   * @throws Will throw an error if the task creation fails.
   */
  create: async (payload: CreateTaskPayload): Promise<TaskId> => {
    try {
      const responseDto = await httpClient.post(API_ROUTES.TASKS, payload);

      return String(responseDto.id) as TaskId;
    } catch (error) {
      throw handleError("Failed to create task", error);
    }
  },

  /**
   * Updates an existing task by sending a PATCH request to the API.
   *
   * @param task - The task entity to update.
   * @returns A promise that resolves to the updated task domain object.
   * @throws Will throw an error if the update operation fails.
   */
  update: async (payload: UpdateTaskPayload): Promise<Task> => {
    try {
      const { taskId } = payload;
      const responseDto = await httpClient.patch(API_ROUTES.TASKS_BY_ID(taskId), payload);

      return createTask(responseDto);
    } catch (error) {
      throw handleError("Failed to edit task", error);
    }
  },

  /**
   * Deletes a task by its unique identifier.
   *
   * Sends a DELETE request to the API to remove the specified task.
   * Logs an error and throws a handled exception if the operation fails.
   *
   * @param id - The unique identifier of the task to delete.
   * @returns A promise that resolves when the task is successfully deleted.
   * @throws An error if the deletion fails.
   */
  delete: async (id: TaskId): Promise<void> => {
    try {
      await httpClient.delete(API_ROUTES.TASKS_BY_ID(id));
    } catch (error) {
      throw handleError("Failed to delete task", error);
    }
  },
});

export const taskRepository = createTaskRepository(axiosClient);
