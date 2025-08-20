import {
  NewProject,
  GetProjects,
  ProjectService,
  AddMembers,
  GetProjectCandidates,
  EditProject,
  GetMembers,
} from "@/domain/project/project.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapUserFromApi } from "../mappers/userMapper";
import { PERMISSIONS, Project, ProjectMember } from "@/domain/project/project.entity";
import { ApiProject, mapProjectFromApi } from "./projectMapper";
import { hasPermission } from "@/shared/utils/permissions";
import { ApiTask, mapProjectTasksFromApi } from "./taskMapper";

//TODO: Handle different error types appropriately

const getProjects: GetProjects = async () => {
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
};

const newProject: NewProject = async (payload) => {
  try {
    const response = await axiosClient.post<Project>(API_ROUTES.PROJECTS, payload);
    const { id } = response.data;
    return await getProjectById(id);
  } catch (error) {
    clientLogger.error("Create project error", { error, payload });
    throw new AppError(AppErrorType.SERVER, "Failed to create project");
  }
};

const getProjectById = async (id: number) => {
  try {
    const response = await axiosClient.get<ApiProject>(API_ROUTES.PROJECT_BY_ID(id));
    return mapProjectFromApi(response.data);
  } catch (error) {
    clientLogger.error("Get project by ID error", { error });
    throw new AppError(AppErrorType.SERVER, "Failed to get project by ID");
  }
};

const addMembers: AddMembers = async (emails, id) => {
  try {
    await axiosClient.post<string[]>(API_ROUTES.PROJECT_MEMBERS(id), {
      emails,
    });
  } catch (error) {
    clientLogger.error("Add members error", { error });
    throw new AppError(AppErrorType.SERVER, "Failed to add members to project");
  }
};

const getProjectCandidates: GetProjectCandidates = async (id?: number) => {
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
};

const editProject: EditProject = async (id, payload) => {
  try {
    return axiosClient.patch(API_ROUTES.PROJECT_BY_ID(id), payload);
  } catch (error) {
    clientLogger.error("Edit project error", { error, id, payload });
    throw new AppError(AppErrorType.SERVER, "Failed to edit project");
  }
};

const getMembers: GetMembers = async (id) => {
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
};

const deleteProject = async (id: number) => {
  try {
    await axiosClient.delete(API_ROUTES.PROJECT_BY_ID(id));
  } catch (error) {
    clientLogger.error("Delete project error", { error, id });
    throw new AppError(AppErrorType.SERVER, "Failed to delete project");
  }
};

const kickMember = async (projectId: number, memberId: number) => {
  try {
    await axiosClient.delete(API_ROUTES.KICK_MEMBER(projectId, memberId));
  } catch (error) {
    clientLogger.error("Kick member error", { error, projectId, memberId });
    throw new AppError(AppErrorType.SERVER, "Failed to kick member from project");
  }
};

const leave = async (id: number) => {
  try {
    await axiosClient.delete(API_ROUTES.LEAVE_PROJECT(id));
  } catch (error) {
    clientLogger.error("Leave project error", { error, id });
    throw new AppError(AppErrorType.SERVER, "Failed to leave project");
  }
};

const getTasks = async (id: number) => {
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
};

export const projectService: ProjectService = {
  getProjects: getProjects,
  newProject: newProject,
  getProjectById: getProjectById,
  addMembers: addMembers,
  getProjectCandidates: getProjectCandidates,
  editProject: editProject,
  getMembers: getMembers,
  deleteProject: deleteProject,
  kickMember: kickMember,
  leave: leave,
  getTasks: getTasks,
};
