import { createGetProjectsThunk } from "./createGetProjectsThunk";
import { projectService } from "@/infrastructure/api/projectService";
import { createNewProjectThunk } from "./createNewProjectThunk";
import { createGetProjectByIdThunk } from "./createGetProjectByIdThunk";

export const getProjectsThunk = createGetProjectsThunk(
  projectService.getProjects
);
export const getProjectByIdThunk = createGetProjectByIdThunk(
  projectService.getProjectById
);
export const newProjectThunk = createNewProjectThunk(
  projectService.newProject,
  projectService.addMembers
);
