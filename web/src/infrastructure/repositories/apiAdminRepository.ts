import type { AdminRepository } from "@/domain/repositories/AdminRepository";

import type {
  AdminUser,
  MailSettingsRequest,
  PasswordResetLink,
  ServiceSettings,
  UpdateAdminUserRequest,
  UpdateServiceSettingsRequest,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";
import { MAIL_REQUEST_TIMEOUT_MS } from "../http/timeouts";

import { toAdminUser, toPasswordResetLink, toServiceSettings } from "./mappers";

// Errors arrive from HttpClient already as AppError with the API code (http/apiError.ts).
const createAdminRepository = (http: HttpClient): AdminRepository => ({
  getSettings: async () =>
    toServiceSettings(await http.get<ServiceSettings>(API_ROUTES.ADMIN_SETTINGS)),

  updateServiceUrl: async (serviceUrl) => {
    const body: UpdateServiceSettingsRequest = { serviceUrl };

    return toServiceSettings(await http.patch<ServiceSettings>(API_ROUTES.ADMIN_SETTINGS, body));
  },

  // The server checks the SMTP connection for up to 10 seconds before responding — a longer timeout
  saveMail: async ({ host, port, encryption, sender, username, password }) => {
    const body: MailSettingsRequest = { host, port, encryption, sender, username };

    // No `password` field — the server keeps the saved password, null deletes it (saveMailSettings)
    if (password !== undefined) body.password = password;

    const dto = await http.put<ServiceSettings>(API_ROUTES.ADMIN_MAIL, body, {
      timeout: MAIL_REQUEST_TIMEOUT_MS,
    });

    return toServiceSettings(dto);
  },

  disableMail: async () => {
    await http.delete(API_ROUTES.ADMIN_MAIL);
  },

  // The email is sent within the request (ADR-0017) — a longer timeout
  sendTestMail: async () => {
    await http.post(API_ROUTES.ADMIN_TEST_MAIL, undefined, { timeout: MAIL_REQUEST_TIMEOUT_MS });
  },

  findUsers: async () => (await http.get<AdminUser[]>(API_ROUTES.ADMIN_USERS)).map(toAdminUser),

  setAdmin: async (userId, isAdmin) => {
    const body: UpdateAdminUserRequest = { isAdmin };

    return toAdminUser(await http.patch<AdminUser>(API_ROUTES.ADMIN_USER(userId), body));
  },

  createPasswordResetLink: async (userId) =>
    toPasswordResetLink(
      await http.post<PasswordResetLink>(API_ROUTES.ADMIN_PASSWORD_RESET_LINK(userId)),
    ),
});

export const adminRepository: AdminRepository = createAdminRepository(axiosClient);
