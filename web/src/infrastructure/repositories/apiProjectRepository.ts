import type { Project } from "@/domain/models/Project";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import type { TaskStatus } from "@/domain/valueobjects/TaskStatus";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import type {
  CreateProjectPayload,
  ProjectDTO,
  UpdateProjectPayload,
} from "../http/dto/ProjectDTO";
import type { TaskStatusDTO } from "../http/dto/TaskDTO";
import type { HttpClient } from "../http/HttpClient";
import { mapApiProjectsToDomain, mapApiProjectToDomain } from "../http/mappers/project.mapper";
import { mapApiTaskStatusesToDomain } from "../http/mappers/taskStatus.mapper";

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

const createCreateProjectPayload = (
  name: string,
  description?: string,
  participants?: string[],
): CreateProjectPayload => {
  return {
    name,
    description,
    participants,
  };
};

const createUpdatePayload = (name?: string, description?: string): UpdateProjectPayload => {
  return {
    name,
    description,
  };
};

const createProjectRepository = (httpClient: HttpClient): ProjectRepository => ({
  /**
   * Retrieves a project by its unique identifier.
   *
   * @param id - The unique identifier of the project to retrieve.
   * @returns A promise that resolves to the corresponding {@link Project} domain object.
   * @throws Will throw an error if the project cannot be retrieved.
   */
  findById: async (id: ProjectId): Promise<Project> => {
    try {
      const dto = await httpClient.get<ProjectDTO>(API_ROUTES.PROJECT_BY_ID(Number(id.value)));
      return mapApiProjectToDomain(dto);
    } catch (error) {
      clientLogger.error("Get project by ID error", { error, id: id.value });
      throw handleError("Failed to get project by ID", error);
    }
  },

  /**
   * Retrieves all projects from the API.
   *
   * @returns {Promise<Project[]>} A promise that resolves to an array of `Project` domain objects.
   * @throws {AppError} Throws an `AppError` if the response format is invalid or if the request fails.
   *
   * @example
   * const projects = await repository.findAll();
   */
  findAll: async (): Promise<Project[]> => {
    try {
      const dtos = await httpClient.get<ProjectDTO[]>(API_ROUTES.PROJECTS);

      if (!Array.isArray(dtos)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }

      return mapApiProjectsToDomain(dtos);
    } catch (error) {
      clientLogger.error("Get projects error", { error });
      throw handleError("Failed to get projects", error);
    }
  },

  /**
   * Creates a new project using the provided payload.
   *
   * @param data - The payload containing project details such as name, description, and participants.
   * @returns A promise that resolves to the created {@link Project} domain object.
   * @throws Will throw an error if the project creation fails.
   */
  create: async (data: CreateProjectPayload): Promise<ProjectId> => {
    try {
      const payload = createCreateProjectPayload(data.name, data.description, data.participants);

      const responseDto = await httpClient.post<{ id: number }>(API_ROUTES.PROJECTS, payload);

      return ProjectId.create(responseDto.id);
    } catch (error) {
      clientLogger.error("Create project error", { error, data });
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
  update: async (project: Project): Promise<Project> => {
    try {
      const payload = createUpdatePayload(project.name, project.description);

      const responseDto = await httpClient.patch<ProjectDTO>(
        API_ROUTES.PROJECT_BY_ID(Number(project.id)),
        payload,
      );

      if (responseDto) {
        return mapApiProjectToDomain(responseDto);
      }

      return project;
    } catch (error) {
      clientLogger.error("Edit project error", {
        error,
        id: project.id.value,
        project,
      });
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
      await httpClient.delete(API_ROUTES.PROJECT_BY_ID(Number(id.value)));
    } catch (error) {
      clientLogger.error("Delete project error", { error, id: id.value });
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
      const projectId = Number(id.value);
      const dtos = await httpClient.get<TaskStatusDTO[]>(API_ROUTES.PROJECT_STATUSES(projectId));

      if (!Array.isArray(dtos)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return mapApiTaskStatusesToDomain(dtos);
    } catch (error) {
      clientLogger.error("Get project statuses error", { error });
      throw handleError("Failed to get project statuses", error);
    }
  },
});

export { createProjectRepository, type ApiProjectRepository };
