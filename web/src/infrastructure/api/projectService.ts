import {
  NewProject,
  GetProjects,
  ProjectService,
} from "@/domain/project/project.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { mapProjectFromApi } from "../mappers/projectMappers";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { ApiProject } from "./types";

//TODO: Handle different error types appropriately

const getProjects: GetProjects = async () => {
  try {
    const response = await axiosClient.get<ApiProject[]>(API_ROUTES.PROJECTS);

    if (!Array.isArray(response.data)) {
      throw new AppError(
        AppErrorType.SERVER,
        "Invalid response format: expected array"
      );
    }

    return response.data.map((rawProject) => mapProjectFromApi(rawProject));
  } catch (error) {
    clientLogger.error("Get projects error", { error });
    throw new AppError(AppErrorType.SERVER, "Failed to get projects");
  }
};

const newProject: NewProject = async (payload) => {
  try {
    const response = await axiosClient.post<ApiProject>(
      API_ROUTES.PROJECTS,
      payload
    );
    return mapProjectFromApi(response.data);
  } catch (error) {
    clientLogger.error("Create project error", { error });
    throw new AppError(AppErrorType.SERVER, "Failed to create project");
  }
};

export const projectService: ProjectService = {
  getProjects: getProjects,
  newProject: newProject,
};
