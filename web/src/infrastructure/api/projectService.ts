import { ProjectService } from "@/domain/project/project.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapUserFromApi } from "../mappers/userMapper";
import { PERMISSIONS, Project, ProjectMember } from "@/domain/project/project.entity";
import { ApiProject, mapProjectFromApi } from "./projectMapper";
import { hasPermission } from "@/shared/utils/permissions";
import { ApiStatus, ApiTask, mapProjectTasksFromApi, mapTaskStatus } from "./taskMapper";

//TODO: Handle different error types appropriately.

export const projectService: ProjectService = {
  /**
   * Fetches the list of all projects.
   * Sends a GET request to the projects endpoint.
   * @returns Promise resolving to an array of Project objects.
   * Throws AppError on request or response failure.
   */
  async get() {
    try {
      const response = await axiosClient.get<Project[]>(API_ROUTES.PROJECTS);
      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data;
    } catch (error) {
      clientLogger.error("Get projects error", { error });
      throw new AppError(AppErrorType.SERVER, "Failed to get projects");
    }
  },

  /**
   * Creates a new project with the provided payload.
   * Sends a POST request to the projects endpoint.
   * @param payload - The data for the new project.
   * @returns Promise resolving to the created Project object.
   * Throws AppError on request or response failure.
   */
  async create(payload) {
    try {
      const response = await axiosClient.post<Project>(API_ROUTES.PROJECTS, payload);
      const { id } = response.data;
      const project = await this.getById(id);
      if (!project) {
        throw new AppError(AppErrorType.SERVER, "Created project not found");
      }
      return project;
    } catch (error) {
      clientLogger.error("Create project error", { error, payload });
      throw new AppError(AppErrorType.SERVER, "Failed to create project");
    }
  },

  /**
   * Fetches a project by its ID and maps the API response to a Project object.
   * @param id - The project ID.
   * @returns Promise resolving to a mapped Project object.
   * Throws AppError on request or response failure.
   */
  async getById(id: number) {
    try {
      const response = await axiosClient.get<ApiProject>(API_ROUTES.PROJECT_BY_ID(id));
      return mapProjectFromApi(response.data);
    } catch (error) {
      clientLogger.error("Get project by ID error", { error });
      throw new AppError(AppErrorType.SERVER, "Failed to get project by ID");
    }
  },

  /**
   * Adds members to a project by their email addresses.
   * Sends a POST request to the project members endpoint with the provided emails.
   * @param emails - Array of email addresses to add as members.
   * @param id - The project ID.
   * @returns Promise resolving when members are successfully added.
   * Throws AppError on request or response failure.
   */
  async addMembers(emails, id) {
    try {
      await axiosClient.post<string[]>(API_ROUTES.PROJECT_MEMBERS(id), {
        emails,
      });
    } catch (error) {
      clientLogger.error("Add members error", { error });
      throw new AppError(AppErrorType.SERVER, "Failed to add members to project");
    }
  },

  async getCandidates(id?: number) {
    /**
     * Fetches the list of candidate users for a given project.
     * Each candidate is mapped from API response to a user object.
     * @param id - (Optional) The project ID to filter candidates.
     * @returns Promise resolving to an array of user objects.
     * Throws AppError on request or response failure.
     */
    try {
      const response = await axiosClient.get(API_ROUTES.GET_CANDIDATES(id));
      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data.map((rawUser) => mapUserFromApi(rawUser));
    } catch (error) {
      clientLogger.error("Get project candidates error", { error });
      throw new AppError(AppErrorType.SERVER, "Failed to get project candidates");
    }
  },

  /**
   * Edits an existing project with the provided payload.
   * Sends a PATCH request to the project endpoint.
   * @param id - The project ID.
   * @param payload - The data to update the project with.
   * @returns Promise resolving to the updated project response.
   * Throws AppError on request or response failure.
   */
  async edit(id, payload) {
    try {
      return axiosClient.patch(API_ROUTES.PROJECT_BY_ID(id), payload);
    } catch (error) {
      clientLogger.error("Edit project error", { error, id, payload });
      throw new AppError(AppErrorType.SERVER, "Failed to edit project");
    }
  },

  /**
   * Fetches the list of members for a given project.
   * Each member object is extended with isOwner and isAdmin flags based on their permissions.
   * @param id - The project ID.
   * @returns Promise resolving to an array of ProjectMember objects with isOwner and isAdmin properties.
   * Throws AppError on request or response failure.
   */
  async getMembers(id) {
    try {
      const response = await axiosClient.get<ProjectMember[]>(API_ROUTES.PROJECT_MEMBERS(id));

      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data.map((member) => {
        return {
          ...member,
          isOwner: hasPermission(member.permissions, PERMISSIONS.PROJECT_OWNER),
          isAdmin: hasPermission(member.permissions, PERMISSIONS.PROJECT_ADMIN),
        };
      });
    } catch (error) {
      clientLogger.error("Get project members error", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to get project members");
    }
  },

  /**
   * Deletes a project by its ID.
   * Sends a DELETE request to the project endpoint.
   * @param id - The project ID.
   * @returns Promise resolving when the project is successfully deleted.
   * Throws AppError on request or response failure.
   */
  async delete(id: number) {
    try {
      await axiosClient.delete(API_ROUTES.PROJECT_BY_ID(id));
    } catch (error) {
      clientLogger.error("Delete project error", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to delete project");
    }
  },

  /**
   * Removes a member from a project by their member ID.
   * Sends a DELETE request to the kick member endpoint.
   * @param projectId - The project ID.
   * @param memberId - The member ID to be removed from the project.
   * @returns Promise resolving when the member is successfully removed.
   * Throws AppError on request or response failure.
   */
  async kickMember(projectId: number, memberId: number) {
    try {
      await axiosClient.delete(API_ROUTES.KICK_MEMBER(projectId, memberId));
    } catch (error) {
      clientLogger.error("Kick member error", { error, projectId, memberId });
      throw new AppError(AppErrorType.SERVER, "Failed to kick member from project");
    }
  },

  /**
   * Leaves a project by its ID.
   * Sends a DELETE request to the leave project endpoint.
   * @param id - The project ID.
   * @returns Promise resolving when the user has left the project.
   * Throws AppError on request or response failure.
   */
  async leave(id: number) {
    try {
      await axiosClient.delete(API_ROUTES.LEAVE_PROJECT(id));
    } catch (error) {
      clientLogger.error("Leave project error", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to leave project");
    }
  },

  /**
   * Fetches the list of tasks for a given project.
   * Sends a GET request to the project tasks endpoint and maps the response.
   * @param id - The project ID.
   * @returns Promise resolving to an array of mapped task objects.
   * Throws AppError on request or response failure.
   */
  async getTasks(id: number) {
    try {
      const response = await axiosClient.get<ApiTask[]>(API_ROUTES.PROJECT_TASKS(id));
      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data.map((t) => mapProjectTasksFromApi(t));
    } catch (error) {
      clientLogger.error("Get project tasks error", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to get project tasks");
    }
  },

  /**
   * Fetches the list of task statuses for a given project.
   * @param id - The project ID.
   * @returns Promise resolving to an array of mapped status objects.
   * Throws AppError on request or response failure.
   */
  async getStatuses(id) {
    try {
      const response = await axiosClient.get<ApiStatus[]>(API_ROUTES.PROJECT_STATUSES(id));
      if (!Array.isArray(response.data)) {
        throw new AppError(AppErrorType.SERVER, "Invalid response format: expected array");
      }
      return response.data.map((t) => mapTaskStatus(t));
    } catch (error) {
      clientLogger.error("Get project statuses error", { error, id });
      throw new AppError(AppErrorType.SERVER, "Get project statuses error");
    }
  },
};
