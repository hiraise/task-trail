const API_VERSION = "/v1";
const AUTH = `${API_VERSION}/auth`;
const PASSWORD = `${AUTH}/password`;
const USERS = `${API_VERSION}/users`;
const USERS_ME = `${USERS}/me`;
const PROJECTS = `${API_VERSION}/projects`;

export const API_ROUTES = {
  LOGIN: `${AUTH}/login`,
  LOGOUT: `${AUTH}/logout`,
  SIGNUP: `${AUTH}/register`,
  REFRESH: `${AUTH}/refresh`,
  AUTH_CHECK: `${AUTH}/check`,
  VERIFY: `${AUTH}/verify`,
  RESEND_VERIFICATION: `${AUTH}/resend-verification`,
  CHANGE_PASSWORD: `${PASSWORD}/change`,
  UPLOAD_AVATAR: `${USERS_ME}/avatar`,
  CURRENT_USER: USERS_ME,
  PROJECTS: `${PROJECTS}`,
  PROJECT_BY_ID: (id: number) => `${PROJECTS}/${id}`,
  PROJECT_MEMBERS: (id?: number) => `${PROJECTS}${id ? `/${id}` : ""}/members`,
  GET_CANDIDATES: (id?: number) =>
    `${PROJECTS}/candidates${id ? `/?id=${id}` : ""}`,
};
