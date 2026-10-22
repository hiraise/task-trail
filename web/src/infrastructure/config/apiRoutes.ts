import type { ProjectId, TaskId, TaskStatusId, UserId } from "@/domain/types";

/** Адрес API (`VITE_API_URL`, web/README.md); на стенде — относительный `/api`. */
export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:8080";

const API_VERSION = "/v1";
const AUTH = `${API_VERSION}/auth`;
const PASSWORD = `${AUTH}/password`;
const USERS = `${API_VERSION}/users`;
const USERS_ME = `${USERS}/me`;
const PROJECTS = `${API_VERSION}/projects`;
const TASKS = `${API_VERSION}/tasks`;
const FILES = `${API_VERSION}/files`;
const INVITATIONS = `${AUTH}/invitations`;

export const API_ROUTES = {
  // AUTH API
  LOGIN: `${AUTH}/login`,
  LOGOUT: `${AUTH}/logout`,
  SIGNUP: `${AUTH}/register`,
  REFRESH: `${AUTH}/refresh`,
  CHANGE_PASSWORD: `${PASSWORD}/change`,
  FORGOT_PASSWORD: `${PASSWORD}/forgot`,
  RESET_PASSWORD: `${PASSWORD}/reset`,
  INVITATION_LOOKUP: `${INVITATIONS}/lookup`,
  INVITATION_ACCEPT: `${INVITATIONS}/accept`,
  PUBLIC_SETTINGS: `${API_VERSION}/settings/public`,
  // PROJECTS API
  PROJECTS: PROJECTS,
  PROJECT_BY_ID: (id: ProjectId) => `${PROJECTS}/${id}`,
  PROJECT_MEMBERS: (id: ProjectId) => `${PROJECTS}/${id}/members`,
  PROJECT_MEMBER: (projectId: ProjectId, userId: UserId) =>
    `${PROJECTS}/${projectId}/members/${userId}`,
  GET_CANDIDATES: `${PROJECTS}/candidates`,
  LEAVE_PROJECT: (id: ProjectId) => `${PROJECTS}/${id}/leave`,
  PROJECT_TASKS: (id: ProjectId) => `${PROJECTS}/${id}/tasks`,
  PROJECT_STATUSES: (id: ProjectId) => `${PROJECTS}/${id}/tasks/statuses`,
  // TASKS API
  TASKS: TASKS,
  TASKS_BY_ID: (id: TaskId) => `${TASKS}/${id}`,
  CHANGE_STATUS: (id: TaskId, statusId: TaskStatusId) => `${TASKS}/${id}/status/${statusId}`,
  CHANGE_ASSIGNEE: (id: TaskId, assigneeId?: UserId) =>
    `${TASKS}/${id}/assignee${id ? `/?assigneeId=${assigneeId}` : ""}`,
  // USERS API
  CURRENT_USER: USERS_ME,
  UPLOAD_AVATAR: `${USERS_ME}/avatar`,
  USER_TASKS: `${USERS_ME}/tasks`,
  USER_BY_ID: (id: UserId) => `${USERS}/${id}`,
  // FILES API
  FILE: (id: string) => `${FILES}/${id}`,
};

/** Адрес файла для `<img>` и ссылок: аватарка отдаётся без входа (getFile в контракте). */
export const fileUrl = (id: string): string => `${API_URL}${API_ROUTES.FILE(id)}`;
