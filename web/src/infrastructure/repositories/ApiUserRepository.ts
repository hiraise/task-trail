import type { User } from "@/domain/models/User";
import type { UserRepository } from "@/domain/repositories/UserRepository";
import type { ProjectId } from "@/domain/valueobjects/ProjectId";
import type { UserId } from "@/domain/valueobjects/UserId";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import type { UserDTO } from "../http/dto/UserDTO";
import type { HttpClient } from "../http/HttpClient";
import { UserMapper } from "../http/mappers/UserMapper";

export class ApiUserRepository implements UserRepository {
  constructor(private httpClient: HttpClient) {}

  /**
   * Retrieves the current authenticated user from the API.
   *
   * @returns {Promise<User | null>} A promise that resolves to the current user domain object,
   * or `null` if no user is authenticated.
   * @throws Will log and rethrow an error if the request fails.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const dto = await this.httpClient.get<UserDTO>(API_ROUTES.CURRENT_USER);
      return UserMapper.toDomain(dto);
    } catch (error) {
      clientLogger.error("Get current user error", { error: error });
      throw this.handleError("Failed to get current user", error);
    }
  }

  /**
   * Uploads a new avatar for the current user.
   *
   * Handles the technical aspects of file upload to the API.
   * Business validation should be performed in the Use Case layer.
   *
   * @param data - FormData containing the avatar image file
   * @returns {Promise<string | null>} The new avatar URL or null if upload failed
   * @throws {AppError} If the HTTP request fails
   */

  async uploadAvatar(data: FormData): Promise<string | null> {
    try {
      const response = await this.httpClient.patch(API_ROUTES.UPLOAD_AVATAR, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const avatarUrl = this.extractAvatarUrl(response.data);

      if (avatarUrl) {
        clientLogger.info("Repository: avatar uploaded successfully", { avatarUrl });
      }

      return avatarUrl;
    } catch (error) {
      clientLogger.error("Repository: upload avatar error", { error });
      throw this.handleError("Failed to upload avatar", error);
    }
  }

  /**
   * Extracts avatar URL from API response
   *
   * @private
   * @param responseData - Response data from API
   * @returns {string | null} Avatar URL or null
   */
  private extractAvatarUrl(responseData: unknown): string | null {
    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      const data = responseData as Record<string, unknown>;
      return (data.avatarUrl as string) || null;
    }

    return null;
  }

  /**
   * Updates the current user's information with the provided username.
   *
   * Sends a PATCH request to the API to update the user's username.
   * Returns the updated user domain object.
   * Logs success or error events for monitoring purposes.
   *
   * @param username - The new username to update for the current user (optional).
   * @returns A promise that resolves to the updated {@link User} object.
   * @throws Throws an error if the update operation fails.
   */
  async updateUser(username?: string): Promise<User> {
    try {
      const dto = await this.httpClient.patch<UserDTO>(API_ROUTES.CURRENT_USER, { username });
      const updatedUser = UserMapper.toDomain(dto);

      clientLogger.info("Repository: user updated successfully", { userId: updatedUser.id.value });
      return updatedUser;
    } catch (error) {
      clientLogger.error("Repository: update user error", { error });
      throw this.handleError("Failed to update user", error);
    }
  }

  /**
   * Retrieves a user by their unique identifier.
   *
   * @param id - The unique identifier of the user to retrieve.
   * @returns A promise that resolves to the corresponding {@link User} domain object.
   * @throws Will throw an error if the user cannot be retrieved.
   */
  async findById(id: UserId): Promise<User> {
    try {
      const dto = await this.httpClient.get<UserDTO>(API_ROUTES.USER_BY_ID(Number(id.value)));
      return UserMapper.toDomain(dto);
    } catch (error) {
      clientLogger.error("Get user by ID error", { error, id: id.value });
      throw this.handleError("Failed to get user by ID", error);
    }
  }

  /**
   * Retrieves a list of candidate users for a given project.
   *
   * @param projectId - The ID of the project to find candidates for. Optional.
   * @returns A promise that resolves to an array of `User` domain objects.
   * @throws {AppError} If the server response is invalid or the request fails.
   */
  async findCandidatesForProject(projectId?: ProjectId): Promise<User[]> {
    try {
      const id = Number(projectId?.value);
      const dtos = await this.httpClient.get<UserDTO[]>(API_ROUTES.GET_CANDIDATES(id));

      if (!Array.isArray(dtos)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return UserMapper.toDomainList(dtos);
    } catch (error) {
      clientLogger.error("Get project candidates error", { error });
      throw new AppError(AppErrorType.SERVER, "Failed to get project candidates");
    }
  }

  private handleError(message: string, error: unknown): AppError {
    if (error instanceof AppError) return error;
    return new AppError(AppErrorType.SERVER, message);
  }
}
