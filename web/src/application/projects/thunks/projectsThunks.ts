import { createGetProjectsThunk } from "./createGetProjectsThunk";
import { projectService } from "@/infrastructure/api/projectService";
import { createNewProjectThunk } from "./createNewProjectThunk";

export const getProjectsThunk = createGetProjectsThunk(
  projectService.getProjects
);
export const newProjectThunk = createNewProjectThunk(projectService.newProject);
