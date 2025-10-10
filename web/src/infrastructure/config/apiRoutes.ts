const API_VERSION = "/v1";
const AUTH = `${API_VERSION}/auth`;
const PASSWORD = `${AUTH}/password`;
const USERS = `${API_VERSION}/users`;
const USERS_ME = `${USERS}/me`;
const PROJECTS = `${API_VERSION}/projects`;
const TASKS = `${API_VERSION}/tasks`;

export const API_ROUTES = {
  // AUTH API
  LOGIN: `${AUTH}/login`,
  LOGOUT: `${AUTH}/logout`,
  SIGNUP: `${AUTH}/register`,
  REFRESH: `${AUTH}/refresh`,
  AUTH_CHECK: `${AUTH}/check`,
  VERIFY: `${AUTH}/verify`,
  RESEND_VERIFICATION: `${AUTH}/resend-verification`,
  CHANGE_PASSWORD: `${PASSWORD}/change`,
  FORGOT_PASSWORD: `${PASSWORD}/forgot`,
  RESET_PASSWORD: `${PASSWORD}/reset`,
  // PROJECTS API
  PROJECTS: PROJECTS,
  PROJECT_BY_ID: (id: number) => `${PROJECTS}/${id}`,
  PROJECT_MEMBERS: (id?: number) => `${PROJECTS}${id ? `/${id}` : ""}/members`,
  GET_CANDIDATES: (id?: number) => `${PROJECTS}/candidates${id ? `/?id=${id}` : ""}`,
  KICK_MEMBER: (projectId: number, memberId: number) =>
    `${PROJECTS}/${projectId}/members/${memberId}`,
  LEAVE_PROJECT: (id: number) => `${PROJECTS}/${id}/leave`,
  PROJECT_TASKS: (id: number) => `${PROJECTS}/${id}/tasks`,
  PROJECT_STATUSES: (id: number) => `${PROJECTS}/${id}/tasks/statuses`,
  // TASKS API
  TASKS: TASKS,
  TASKS_BY_ID: (id: number) => `${TASKS}/${id}`,
  CHANGE_STATUS: (id: number, statusId: number) => `${TASKS}/${id}/status/${statusId}`,
  CHANGE_ASSIGNEE: (id: number, assigneeId?: number) =>
    `${TASKS}/${id}/assignee${id ? `/?assigneeId=${assigneeId}` : ""}`,
  // USERS API
  CURRENT_USER: USERS_ME,
  UPLOAD_AVATAR: `${USERS_ME}/avatar`,
  USER_TASKS: `${USERS_ME}/tasks`,
  USER_BY_ID: (id: number) => `${USERS}/${id}`,
};
