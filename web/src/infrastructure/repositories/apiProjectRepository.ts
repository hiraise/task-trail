import type { CreateProjectPayload, EditProjectPayload } from "@/application/payloads";
import type { Project, ProjectDetails } from "@/domain/models/Project";
import { createProjectDetails, createProjectListItem } from "@/domain/models/Project";
import { createTaskStatus, type TaskStatus } from "@/domain/models/TaskStatus";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { ProjectId } from "@/domain/types";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import type { HttpClient } from "../http/HttpClient";

type ApiProjectRepository = ProjectRepository;

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

const createProjectRepository = (httpClient: HttpClient): ProjectRepository => ({
  /**
   * Retrieves a project by its unique identifier.
   *
   * @param id - The unique identifier of the project to retrieve.
   * @returns A promise that resolves to the corresponding {@link ProjectDetails} domain object.
   * @throws Will throw an error if the project cannot be retrieved.
   */
  findById: async (id: ProjectId): Promise<ProjectDetails> => {
    try {
      const dto = await httpClient.get(API_ROUTES.PROJECT_BY_ID(id));

      return createProjectDetails(dto);
    } catch (error) {
      clientLogger.error("Get project by ID error", { error, id: id });
      throw handleError("Failed to get project by ID", error);
    }
  },

  /**
   * Retrieves all projects from the API.
   *
   * @returns {Promise<ProjectDetails[]>} A promise that resolves to an array of `Project` domain objects.
   * @throws {AppError} Throws an `AppError` if the response format is invalid or if the request fails.
   *
   * @example
   * const projects = await repository.findAll();
   */
  findAll: async (): Promise<Project[]> => {
    try {
      const dtos = await httpClient.get(API_ROUTES.PROJECTS);

      return dtos.map(createProjectListItem);
    } catch (error) {
      clientLogger.error("Get projects error", { error });
      throw handleError("Failed to get projects", error);
    }
  },

  /**
   * Creates a new project using the provided payload.
   *
   * @param data - The payload containing project details such as name, description, and participants.
   * @returns A promise that resolves to the created {@link ProjectDetails} domain object.
   * @throws Will throw an error if the project creation fails.
   */
  create: async (payload: CreateProjectPayload): Promise<ProjectId> => {
    try {
      const responseDto = await httpClient.post<{ id: number }>(API_ROUTES.PROJECTS, payload);

      return String(responseDto.id);
    } catch (error) {
      clientLogger.error("Create project error", { error, payload });
      throw handleError("Failed to create project", error);
    }
  },

  /**
   * Updates an existing project by sending a PATCH request to the API.
   *
   * @param project - The project entity containing updated information.
   * @returns A promise that resolves to the updated project domain object.
   * @throws Will throw an error if the update operation fails.
   */
  update: async (payload: EditProjectPayload): Promise<ProjectDetails> => {
    try {
      const { projectId, ...apiPayload } = payload;
      const responseDto = await httpClient.patch(API_ROUTES.PROJECT_BY_ID(projectId), apiPayload);

      return createProjectDetails(responseDto);
    } catch (error) {
      clientLogger.error("Edit project error", { error, id: payload.projectId });
      throw handleError("Failed to edit project", error);
    }
  },

  /**
   * Deletes a project by its ID.
   *
   * Sends a DELETE request to the API to remove the specified project.
   * Logs an error and throws a handled error if the operation fails.
   *
   * @param id - The unique identifier of the project to delete.
   * @returns A promise that resolves when the project is successfully deleted.
   * @throws Will throw an error if the deletion fails.
   */
  delete: async (id: ProjectId): Promise<void> => {
    try {
      await httpClient.delete(API_ROUTES.PROJECT_BY_ID(id));
    } catch (error) {
      clientLogger.error("Delete project error", { error, id: id });
      throw handleError("Failed to delete project", error);
    }
  },

  /**
   * Retrieves the list of task statuses for a given project.
   *
   * @param id - The unique identifier of the project.
   * @returns A promise that resolves to an array of `TaskStatus` objects associated with the project.
   * @throws {AppError} Throws an error if the server response is invalid or if the request fails.
   */
  getProjectStatuses: async (id: ProjectId): Promise<TaskStatus[]> => {
    try {
      const projectId = id as ProjectId;
      const dtos = await httpClient.get(API_ROUTES.PROJECT_STATUSES(projectId));

      return dtos.map(createTaskStatus);
    } catch (error) {
      clientLogger.error("Get project statuses error", { error });
      throw handleError("Failed to get project statuses", error);
    }
  },
});

export { createProjectRepository, type ApiProjectRepository };
