import { createGetProjectsThunk } from "./createGetProjectsThunk";
import { projectService } from "@/infrastructure/api/projectService";
import { createNewProjectThunk } from "./createNewProjectThunk";
import { createGetProjectByIdThunk } from "./createGetProjectByIdThunk";
import { createGetProjectCandidatesThunk } from "./createGetProjectCandidatesThunk";

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
export const getProjectCandidatesThunk = createGetProjectCandidatesThunk(
  projectService.getProjectCandidates
);
