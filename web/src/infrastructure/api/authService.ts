import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";

import axiosClient from "./axiosClient";
import { AuthPayload } from "@/application/auth/types/types";
import { Domain, mapHttpError } from "@/shared/errors/mapHttpError";

export const authService = {
  login: async (payload: AuthPayload): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.LOGIN, payload);
    } catch (error) {
      clientLogger.error("Login error", { error: error });
      throw mapHttpError(error, Domain.LOGIN);
    }
  },
  signUp: async (payload: AuthPayload): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.SIGNUP, payload);
    } catch (error) {
      clientLogger.error("SignUp error", { error: error });
      throw mapHttpError(error, Domain.SIGNUP);
    }
  },
  resendVerification: async (email: string): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.RESEND_VERIFICATION, { email });
    } catch (error) {
      clientLogger.error("ResendVerification error", { error: error });
      throw mapHttpError(error, Domain.RESEND_VERIFICATION);
    }
  },
  verifyEmail: async (token: string): Promise<void> => {
    try {
      await axiosClient.post(API_ROUTES.VERIFY, { token });
    } catch (error) {
      clientLogger.error("Verify Email error", { error: error });
      throw mapHttpError(error, Domain.CONFIRM_EMAIL);
    }
  },
};
