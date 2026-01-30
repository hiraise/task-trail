import type {
  ChangeAssigneePayload,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "@/application/payloads";
import { createTask, type Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { ProjectId, TaskId, TaskStatusId, UserId } from "@/domain/types";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import type { HttpClient } from "../http/HttpClient";

type ApiTaskRepository = TaskRepository;

const handleError = (message: string, error: unknown): AppError => {
  if (error instanceof AppError) return error;

  return new AppError(AppErrorType.SERVER, message);
};

const createTaskRepository = (httpClient: HttpClient): TaskRepository => ({
  /**
   * Changes the assignee of the specified task to the given user.
   *
   * @param task - The task whose assignee is to be changed.
   * @param assigneeId - The user ID of the new assignee.
   * @returns A promise that resolves to the updated Task object.
   * @throws Throws an error if the assignee change fails.
   */
  changeAssignee: async (task: Task, assigneeId: UserId): Promise<Task> => {
    try {
      const payload: ChangeAssigneePayload = { taskId: task.id, assigneeId };
      const responseDto = await httpClient.patch(
        API_ROUTES.CHANGE_ASSIGNEE(task.id, assigneeId),
        payload,
      );

      if (responseDto) return createTask(responseDto);

      return task;
    } catch (error) {
      clientLogger.error("Change assignee error", { error });
      throw handleError("Failed to change assignee", error);
    }
  },

  /**
   * Changes the status of the specified task to the given status ID.
   *
   * @param task - The task whose status is to be changed.
   * @param statusId - The ID of the new status to set for the task.
   * @returns A promise that resolves to the updated Task object.
   * @throws Will throw an error if the status change fails.
   */
  changeStatus: async (task: Task, statusId: TaskStatusId): Promise<Task> => {
    try {
      const responseDto = await httpClient.patch(API_ROUTES.CHANGE_STATUS(task.id, statusId));

      if (responseDto) return createTask(responseDto);

      return task;
    } catch (error) {
      clientLogger.error("Change status error", { error });
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

      return dtos.map(createTask);
    } catch (error) {
      clientLogger.error("Get tasks error", { error });
      throw handleError("Failed to get tasks", error);
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
      clientLogger.error("Get task by ID error", { error, id });
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

      return dtos.map(createTask);
    } catch (error) {
      clientLogger.error("Failed to get user tasks", { error });
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
      clientLogger.error("Create task error", { error, payload });
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
  update: async (task: Task): Promise<Task> => {
    try {
      const payload: UpdateTaskPayload = { name: task.name, description: task.description };
      const responseDto = await httpClient.patch(API_ROUTES.TASKS_BY_ID(task.id), payload);

      if (responseDto) return createTask(responseDto);

      return task;
    } catch (error) {
      clientLogger.error("Edit task error", { error, id: task.id, task });
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
      clientLogger.error("Delete task error", { error, id });
      throw handleError("Failed to delete task", error);
    }
  },
});

export { createTaskRepository, type ApiTaskRepository };
