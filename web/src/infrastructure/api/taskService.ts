import { TaskService } from "@/domain/task/task.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapProjectTasksFromApi } from "./taskMapper";

export const taskService: TaskService = {
  /**
   * Creates a new task using the provided payload.
   *
   * Sends a POST request to the tasks API endpoint with the given payload.
   * Returns the ID of the newly created task on success.
   * Logs an error and throws an `AppError` if the request fails.
   *
   * @param payload - The data required to create a new task.
   * @returns A promise that resolves to the ID of the created task.
   * @throws {AppError} If the task creation fails due to a server error.
   */
  async create(payload) {
    try {
      const result = await axiosClient.post(API_ROUTES.TASKS, payload);
      return result.data.id;
    } catch (error) {
      clientLogger.error("Failed to create task", { error, payload });
      throw new AppError(AppErrorType.SERVER, "Failed to create task");
    }
  },

  /**
   * Retrieves a task by its unique identifier.
   *
   * @param id - The unique identifier of the task to fetch.
   * @returns A promise that resolves to the mapped task object from the API.
   * @throws {AppError} Throws an AppError of type SERVER if the task fetch fails.
   */
  async getTask(id) {
    try {
      const result = await axiosClient.get(API_ROUTES.TASKS_BY_ID(id));
      return mapProjectTasksFromApi(result.data);
    } catch (error) {
      clientLogger.error("Failed to fetch task", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to fetch task");
    }
  },

  /**
   * Changes the status of a task by sending a PATCH request to the API.
   *
   * @param payload - An object containing the task ID and the new status ID.
   * @param payload.id - The unique identifier of the task to update.
   * @param payload.statusId - The identifier of the new status to set for the task.
   * @returns A promise that resolves with the API response if the status change is successful.
   * @throws {AppError} Throws an AppError of type SERVER if the API request fails.
   */
  async changeStatus(payload) {
    const { id, statusId } = payload;
    try {
      return await axiosClient.patch(API_ROUTES.CHANGE_STATUS(id, statusId));
    } catch (error) {
      clientLogger.error(`Failed to change task {id: ${id}} with status {statusId: ${statusId}}`, {
        error,
      });
      throw new AppError(AppErrorType.SERVER, "Failed to change task status");
    }
  },

  /**
   * Changes the assignee of a task.
   *
   * Sends a PATCH request to update the assignee of the specified task.
   * If the request fails, logs the error and throws an {@link AppError} of type SERVER.
   *
   * @param payload - An object containing the task ID and the new assignee's ID.
   * @param payload.id - The ID of the task to update.
   * @param payload.assigneeId - The ID of the new assignee.
   * @returns A promise resolving to the response from the API.
   * @throws {AppError} If the server request fails.
   */
  async changeAssignee(payload) {
    const { id, assigneeId } = payload;
    try {
      return await axiosClient.patch(API_ROUTES.CHANGE_ASSIGNEE(id, assigneeId));
    } catch (error) {
      clientLogger.error(
        `Failed to change task {id: ${id}} with assignee {assigneeId: ${assigneeId}}`,
        { error }
      );
      throw new AppError(AppErrorType.SERVER, "Failed to change task assignee");
    }
  },

  /**
   * Updates an existing task with the specified payload.
   *
   * @param id - The unique identifier of the task to be edited.
   * @param payload - The data to update the task with.
   * @throws {AppError} Throws an AppError of type SERVER if the update fails.
   */
  async editTask(id, payload) {
    try {
      await axiosClient.patch(API_ROUTES.TASKS_BY_ID(id), payload);
    } catch (error) {
      clientLogger.error(`Failed to change task {id: ${id}}`, { error });
      throw new AppError(AppErrorType.SERVER, "Failed to change task");
    }
  },
};
