import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapAvatarFromApi, mapUserFromApi } from "./userMapper";
import { UserService } from "@/domain/user/user.contracts";
import { User } from "@/domain/user/user.entity";

export const userService: UserService = {
  /**
   * Retrieves the current authenticated user's information from the API.
   *
   * @returns {Promise<User>} A promise that resolves to the mapped User entity.
   * @throws {AppError} Throws an AppError if the request fails.
   */
  async getCurrentUser() {
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
   * @returns {Promise<Avatar>} A promise that resolves to the mapped Avatar entity.
   * @throws {AppError} Throws an AppError if the upload fails.
   */
  async uploadAvatar(data: FormData) {
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
  async updateUser(user: Partial<User>) {
    try {
      const response = await axiosClient.patch(API_ROUTES.CURRENT_USER, user);
      return mapUserFromApi(response.data);
    } catch (error) {
      clientLogger.error("Update user error", { error });
      throw new AppError(AppErrorType.UNKNOWN, "Failed to update user");
    }
  },
};
