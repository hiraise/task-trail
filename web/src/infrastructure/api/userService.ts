import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { UserService } from "@/domain/user/user.contracts";
import { User } from "@/domain/user/user.entity";
import { Task } from "@/domain/task/task.entity";
import { mapAvatarFromApi, mapUserFromApi } from "./userMapper";
import { mapProjectTasksFromApi } from "./taskMapper";

export const userService: UserService = {
  /**
   * Retrieves the current authenticated user's information from the API.
   *
   * @returns {Promise<User>} A promise that resolves to the mapped User entity.
   * @throws {AppError} Throws an AppError if the request fails.
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await axiosClient.get(API_ROUTES.CURRENT_USER);
      return mapUserFromApi(response.data);
    } catch (error) {
      clientLogger.error("Get current user error", { error: error });
      throw new AppError(AppErrorType.UNKNOWN, "Failed to get current user");
    }
  },

  /**
   * Uploads a new avatar for the current user.
   *
   * Sends a PATCH request with the provided FormData containing the avatar image.
   *
   * @param {FormData} data - The FormData object containing the avatar image file.
   * @returns {Promise<string | null>} A promise that resolves to the mapped avatar url.
   * @throws {AppError} Throws an AppError if the upload fails.
   */
  async uploadAvatar(data: FormData): Promise<string | null> {
    try {
      const response = await axiosClient.patch(API_ROUTES.UPLOAD_AVATAR, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return mapAvatarFromApi(response.data);
    } catch (error) {
      clientLogger.error("Upload avatar error", { error });
      throw new AppError(AppErrorType.UNKNOWN, "Failed to upload avatar");
    }
  },

  /**
   * Updates the current authenticated user's information.
   *
   * Sends a PATCH request to the API with the provided partial user data.
   *
   * @param {Partial<User>} user - An object containing the fields to update for the user.
   * @returns {Promise<User>} A promise that resolves to the updated and mapped User entity.
   * @throws {AppError} Throws an AppError if the update request fails.
   */
  async updateUser(user: Partial<User>): Promise<User> {
    try {
      const response = await axiosClient.patch(API_ROUTES.CURRENT_USER, user);
      return mapUserFromApi(response.data);
    } catch (error) {
      clientLogger.error("Update user error", { error });
      throw new AppError(AppErrorType.UNKNOWN, "Failed to update user");
    }
  },

  /**
   * Retrieves all tasks assigned to the current user.
   *
   * @returns {Promise<Task[]>} A promise that resolves to an array of project tasks.
   * @throws {AppError} Throws an AppError if the request fails or the response format is invalid.
   */
  async getTasks(): Promise<Task[]> {
    try {
      const response = await axiosClient.get(API_ROUTES.USER_TASKS);
      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data.map((rawTask) => mapProjectTasksFromApi(rawTask));
    } catch (error) {
      clientLogger.error("Failed to get user tasks", { error });
      throw new AppError(AppErrorType.UNKNOWN, "Failed to get user tasks");
    }
  },
};
