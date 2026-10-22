import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { createTaskStatus } from "@/domain/models/TaskStatus";

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

// Ошибки приходят из HttpClient уже как AppError с кодом API (http/apiError.ts).
const createProjectRepository = (http: HttpClient): ProjectRepository => ({
  findById: async (id) => toProjectDetails(await http.get<ProjectDetails>(API_ROUTES.PROJECT_BY_ID(id))),

  findAll: async () => (await http.get<Project[]>(API_ROUTES.PROJECTS)).map(toProject),

  // Почты из emails зовутся в проект в том же запросе, письма уходят сразу — тайм-аут длиннее
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

  // Старый адрес статусов: на GET /v1/task-statuses веб переходит в шаге 6.3 (docs/roadmap.md)
  getProjectStatuses: async (id) => {
    const dtos = await http.get<unknown[]>(API_ROUTES.PROJECT_STATUSES(id));

    return dtos.map(createTaskStatus);
  },
});

export const projectRepository: ProjectRepository = createProjectRepository(axiosClient);
