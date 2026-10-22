import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";

import type {
  AddMembersRequest,
  ChangeMemberRoleRequest,
  InvitationResult,
  Member,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";
import { MAIL_REQUEST_TIMEOUT_MS } from "../http/timeouts";

import { toInvitationResult, toProjectMember } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createProjectMemberRepository = (http: HttpClient): ProjectMemberRepository => ({
  findByProjectId: async (projectId) =>
    (await http.get<Member[]>(API_ROUTES.PROJECT_MEMBERS(projectId))).map(toProjectMember),

  // Invitation emails are sent within the request (ADR-0017) — a longer timeout
  addByEmails: async (projectId, emails) => {
    const body: AddMembersRequest = { emails };
    const results = await http.post<InvitationResult[]>(API_ROUTES.PROJECT_MEMBERS(projectId), body, {
      timeout: MAIL_REQUEST_TIMEOUT_MS,
    });

    return results.map(toInvitationResult);
  },

  changeRole: async (projectId, userId, role) => {
    const body: ChangeMemberRoleRequest = { role };

    return toProjectMember(await http.patch<Member>(API_ROUTES.PROJECT_MEMBER(projectId, userId), body));
  },

  removeMember: async (projectId, userId) => {
    await http.delete(API_ROUTES.PROJECT_MEMBER(projectId, userId));
  },

  leaveProject: async (projectId) => {
    await http.delete(API_ROUTES.LEAVE_PROJECT(projectId));
  },
});

export const projectMemberRepository: ProjectMemberRepository =
  createProjectMemberRepository(axiosClient);
