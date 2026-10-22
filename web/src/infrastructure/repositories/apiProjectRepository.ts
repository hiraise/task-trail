import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";

import type {
  CreateProjectRequest,
  ProjectCreated,
  ProjectDetails,
  Project,
  UpdateProjectRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";
import { MAIL_REQUEST_TIMEOUT_MS } from "../http/timeouts";

import { toInvitationResult, toProject, toProjectDetails } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createProjectRepository = (http: HttpClient): ProjectRepository => ({
  findById: async (id) => toProjectDetails(await http.get<ProjectDetails>(API_ROUTES.PROJECT_BY_ID(id))),

  findAll: async () => (await http.get<Project[]>(API_ROUTES.PROJECTS)).map(toProject),

  // Addresses from emails are invited in the same request and emails go out at once — a longer timeout
  create: async ({ name, description, emails }) => {
    const body: CreateProjectRequest = { name, description: description ?? null, emails };
    const created = await http.post<ProjectCreated>(API_ROUTES.PROJECTS, body, {
      timeout: MAIL_REQUEST_TIMEOUT_MS,
    });

    return {
      project: toProjectDetails(created.project),
      invitations: created.invitations.map(toInvitationResult),
    };
  },

  update: async (id, changes) => {
    const body: UpdateProjectRequest = changes;

    return toProjectDetails(await http.patch<ProjectDetails>(API_ROUTES.PROJECT_BY_ID(id), body));
  },

  delete: async (id) => {
    await http.delete(API_ROUTES.PROJECT_BY_ID(id));
  },
});

export const projectRepository: ProjectRepository = createProjectRepository(axiosClient);
