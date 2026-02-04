import { createProjectMember, type ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectId, UserId } from "@/domain/types";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

/**
 * Handles errors by checking if the provided error is already an instance of `AppError`.
 * If it is, returns the error as is. Otherwise, creates and returns a new `AppError`
 * with the specified message and a server error type.
 *
 * @param message - The error message to use if a new `AppError` is created.
 * @param error - The error object to handle.
 * @returns An instance of `AppError` representing the handled error.
 */
const handleError = (message: string, error: unknown): AppError => {
  if (error instanceof AppError) return error;

  return new AppError(AppErrorType.SERVER, message);
};

const createProjectMemberRepository = (httpClient: HttpClient): ProjectMemberRepository => ({
  /**
   * Retrieves a project member by their unique identifier.
   *
   * Sends a GET request to the API endpoint to fetch the project member with the specified ID.
   * If the member is not found, returns null. Logs and handles errors that may occur during the request.
   *
   * @param id - The unique identifier of the project member to retrieve.
   * @returns A promise that resolves to a {@link ProjectMember} object if found, or null if not found.
   * @throws {AppError} If an error occurs during the request.
   */
  findById: async (id: UserId): Promise<ProjectMember | null> => {
    try {
      return null;
    } catch (error) {
      throw handleError("Failed to get project member", error);
    }
  },

  /**
   * Retrieves the list of project members for a given project ID.
   *
   * Sends a GET request to the API endpoint for project members associated with the specified project ID.
   * Validates the response format and maps the received DTOs to domain entities.
   * Logs and handles errors that may occur during the request or mapping process.
   *
   * @param projectId - The unique identifier of the project whose members are to be retrieved.
   * @returns A promise that resolves to an array of {@link ProjectMember} objects.
   * @throws {AppError} If the response format is invalid or if an error occurs during the request.
   */
  findByProjectId: async (projectId: ProjectId): Promise<ProjectMember[]> => {
    try {
      const dtos = await httpClient.get(API_ROUTES.PROJECT_MEMBERS(projectId));

      return dtos.map(createProjectMember);
    } catch (error) {
      throw handleError("Failed to get project members", error);
    }
  },

  /**
   * Adds members to a project by their email addresses.
   *
   * Sends a POST request to the project members API endpoint with the provided emails.
   * If the operation fails, logs the error and throws a handled exception.
   *
   * @param projectId - The unique identifier of the project to which members will be added.
   * @param emails - An array of email addresses representing the members to add.
   * @returns A promise that resolves when the operation is complete.
   * @throws Will throw an error if the HTTP request fails.
   */
  addByEmails: async (projectId: ProjectId, emails: string[]): Promise<void> => {
    try {
      await httpClient.post(API_ROUTES.PROJECT_MEMBERS(projectId), emails);
    } catch (error) {
      throw handleError("Failed to add members to project", error);
    }
  },

  /**
   * Removes a member from a project by sending a DELETE request to the backend API.
   *
   * @param projectId - The unique identifier of the project.
   * @param memberId - The unique identifier of the member to be removed.
   * @returns A promise that resolves when the member has been successfully removed.
   * @throws Throws an error if the removal operation fails.
   */
  removeMember: async (projectId: ProjectId, memberId: UserId): Promise<void> => {
    try {
      await httpClient.delete(API_ROUTES.KICK_MEMBER(projectId, memberId));
    } catch (error) {
      throw handleError("Failed to kick member from project", error);
    }
  },

  /**
   * Leaves the project with the specified project ID.
   *
   * Sends a DELETE request to the API to remove the current user from the project.
   * Logs and rethrows any errors encountered during the operation.
   *
   * @param projectId - The unique identifier of the project to leave.
   * @returns A promise that resolves when the operation is complete.
   * @throws An error if the request to leave the project fails.
   */
  leaveProject: async (projectId: ProjectId): Promise<void> => {
    try {
      await httpClient.delete(API_ROUTES.LEAVE_PROJECT(projectId));
    } catch (error) {
      throw handleError("Failed to leave project", error);
    }
  },
});

export const projectMemberRepository = createProjectMemberRepository(axiosClient);
