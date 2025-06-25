const API_VERSION = "/v1";
const AUTH = `${API_VERSION}/auth`;
const USERS = `${API_VERSION}/users`;

export const API_ROUTES = {
  LOGIN: `${AUTH}/login`,
  LOGOUT: `${AUTH}/logout`,
  SIGNUP: `${AUTH}/register`,
  REFRESH: `${AUTH}/refresh`,
  AUTH_CHECK: `${AUTH}/check`,
  VERIFY: `${AUTH}/verify`,
  RESEND_VERIFICATION: `${AUTH}/resend-verification`,
  USER: (id: number) => `${USERS}/${id}`,
};
