import { createGetProjectsThunk } from "./createGetProjectsThunk";
import { projectService } from "@/infrastructure/api/projectService";
import { createNewProjectThunk } from "./createNewProjectThunk";
import { createGetProjectByIdThunk } from "./createGetProjectByIdThunk";
import { createGetProjectCandidatesThunk } from "./createGetProjectCandidatesThunk";
import { createEditProjectThunk } from "./createEditProjectThunk";
import { createGetProjectMembersThunk } from "./createGetProjectMembersThunk";
import { createAddMembersThunk } from "./createAddMembersThunk";
import { createDeleteProjectThunk } from "./createDeleteProjectThunk";

export const getProjectsThunk = createGetProjectsThunk(projectService.getProjects);
export const getProjectByIdThunk = createGetProjectByIdThunk(projectService.getProjectById);
export const newProjectThunk = createNewProjectThunk(
  projectService.newProject,
  projectService.addMembers
);
export const getProjectCandidatesThunk = createGetProjectCandidatesThunk(
  projectService.getProjectCandidates
);
export const editProjectThunk = createEditProjectThunk(projectService.editProject);
export const getMembersThunk = createGetProjectMembersThunk(projectService.getMembers);
export const addMembersThunk = createAddMembersThunk(projectService.addMembers);
export const deleteProjectThunk = createDeleteProjectThunk(projectService.deleteProject);
