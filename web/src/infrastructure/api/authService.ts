import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";

import axiosClient from "./axiosClient";
import { Domain, mapHttpError } from "@/shared/errors/mapHttpError";
import {
  AuthPayload,
  AuthService,
  Login,
  Logout,
  ResendVerification,
  SignUp,
  ConfirmEmail,
} from "@/domain/auth/types";

const login: Login = async (payload: AuthPayload): Promise<void> => {
  try {
    await axiosClient.post(API_ROUTES.LOGIN, payload);
  } catch (error) {
    clientLogger.error("Login error", { error: error });
    throw mapHttpError(error, Domain.LOGIN);
  }
};

const logout: Logout = async (): Promise<void> => {
  try {
    await axiosClient.post(API_ROUTES.LOGOUT);
  } catch (error) {
    clientLogger.error("Logout error", { error: error });
    throw mapHttpError(error, Domain.LOGOUT);
  }
};

const signUp: SignUp = async (payload: AuthPayload): Promise<void> => {
  try {
    await axiosClient.post(API_ROUTES.SIGNUP, payload);
  } catch (error) {
    clientLogger.error("SignUp error", { error: error });
    throw mapHttpError(error, Domain.SIGNUP);
  }
};

const resendVerification: ResendVerification = async (
  email: string
): Promise<void> => {
  try {
    await axiosClient.post(API_ROUTES.RESEND_VERIFICATION, { email });
  } catch (error) {
    clientLogger.error("ResendVerification error", { error: error });
    throw mapHttpError(error, Domain.RESEND_VERIFICATION);
  }
};

const confirmEmail: ConfirmEmail = async (token: string): Promise<void> => {
  try {
    await axiosClient.post(API_ROUTES.VERIFY, { token });
  } catch (error) {
    clientLogger.error("Verify Email error", { error: error });
    throw mapHttpError(error, Domain.CONFIRM_EMAIL);
  }
};

export const authService: AuthService = {
  login: login,
  logout: logout,
  signUp: signUp,
  resendVerification: resendVerification,
  confirmEmail: confirmEmail,
};
