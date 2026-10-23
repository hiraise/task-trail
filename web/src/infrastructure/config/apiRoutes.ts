import type { CommentId, ProjectId, TaskId, UserId } from "@/domain/types";

/** API address (`VITE_API_URL`, web/README.md); on the local stack — the relative `/api`. */
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
const ADMIN = `${API_VERSION}/admin`;
const ADMIN_SETTINGS = `${ADMIN}/settings`;
const ADMIN_MAIL = `${ADMIN_SETTINGS}/mail`;
const ADMIN_USERS = `${ADMIN}/users`;

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
  PROJECT_ARCHIVED: (id: ProjectId) => `${PROJECTS}/${id}/archived`,
  // TASKS API: each task operation has its own URL (ADR-0002)
  TASKS: TASKS,
  TASK_BY_ID: (id: TaskId) => `${TASKS}/${id}`,
  TASK_STATUS: (id: TaskId) => `${TASKS}/${id}/status`,
  TASK_ASSIGNEE: (id: TaskId) => `${TASKS}/${id}/assignee`,
  TASK_PROJECT: (id: TaskId) => `${TASKS}/${id}/project`,
  TASK_ARCHIVED: (id: TaskId) => `${TASKS}/${id}/archived`,
  TASK_COMMENTS: (id: TaskId) => `${TASKS}/${id}/comments`,
  TASK_COMMENT: (id: TaskId, commentId: CommentId) => `${TASKS}/${id}/comments/${commentId}`,
  TASK_EVENTS: (id: TaskId) => `${TASKS}/${id}/events`,
  TASK_STATUSES: `${API_VERSION}/task-statuses`,
  // USERS API
  CURRENT_USER: USERS_ME,
  UPLOAD_AVATAR: `${USERS_ME}/avatar`,
  USER_TASKS: `${USERS_ME}/tasks`,
  USER_BY_ID: (id: UserId) => `${USERS}/${id}`,
  // FILES API
  FILE: (id: string) => `${FILES}/${id}`,
  // ADMIN API: service administrator only (ADR-0014)
  ADMIN_SETTINGS: ADMIN_SETTINGS,
  ADMIN_MAIL: ADMIN_MAIL,
  ADMIN_TEST_MAIL: `${ADMIN_MAIL}/test`,
  ADMIN_USERS: ADMIN_USERS,
  ADMIN_USER: (id: UserId) => `${ADMIN_USERS}/${id}`,
  ADMIN_PASSWORD_RESET_LINK: (id: UserId) => `${ADMIN_USERS}/${id}/password-reset-link`,
};

/** File URL for `<img>` and links: avatars are served without sign-in (getFile in the contract). */
export const fileUrl = (id: string): string => `${API_URL}${API_ROUTES.FILE(id)}`;
