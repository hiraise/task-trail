import type { AuthRepository } from "@/domain/repositories/AuthRepository";

import type {
  AcceptInvitationRequest,
  ChangePasswordRequest,
  Credentials,
  CurrentUser,
  ForgotPasswordRequest,
  InvitationInfo,
  InvitationTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";
import { MAIL_REQUEST_TIMEOUT_MS } from "../http/timeouts";

import { toCurrentUser } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createAuthRepository = (http: HttpClient): AuthRepository => ({
  login: async (email, password) => {
    const body: Credentials = { email, password };

    return toCurrentUser(await http.post<CurrentUser>(API_ROUTES.LOGIN, body));
  },

  logout: async () => {
    await http.post(API_ROUTES.LOGOUT);
  },

  registerFirstAccount: async (data) => {
    const body: RegisterRequest = data;

    return toCurrentUser(await http.post<CurrentUser>(API_ROUTES.SIGNUP, body));
  },

  changePassword: async (oldPassword, newPassword) => {
    const body: ChangePasswordRequest = { oldPassword, newPassword };

    await http.post(API_ROUTES.CHANGE_PASSWORD, body);
  },

  forgotPassword: async (email) => {
    const body: ForgotPasswordRequest = { email };

    await http.post(API_ROUTES.FORGOT_PASSWORD, body, { timeout: MAIL_REQUEST_TIMEOUT_MS });
  },

  resetPassword: async (token, password) => {
    const body: ResetPasswordRequest = { token, password };

    await http.post(API_ROUTES.RESET_PASSWORD, body);
  },

  lookupInvitation: async (token) => {
    const body: InvitationTokenRequest = { token };
    const info = await http.post<InvitationInfo>(API_ROUTES.INVITATION_LOOKUP, body);

    return { email: info.email, projectName: info.projectName, invitedBy: info.invitedBy };
  },

  acceptInvitation: async (data) => {
    const body: AcceptInvitationRequest = data;

    return toCurrentUser(await http.post<CurrentUser>(API_ROUTES.INVITATION_ACCEPT, body));
  },
});

export const authRepository: AuthRepository = createAuthRepository(axiosClient);
