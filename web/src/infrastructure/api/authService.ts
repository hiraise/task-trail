import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";

import axiosClient from "./axiosClient";
import { Domain, mapHttpError } from "@/shared/errors/mapHttpError";
import { AuthService } from "@/domain/auth/auth.contracts";
import { AuthPayload } from "@/domain/auth/auth.payload";
import { AppError, AppErrorType } from "@/shared/errors/types";

export const authService: AuthService = {
  /**
   * Authenticates a user with the provided credentials.
   *
   * @param {AuthPayload} payload - The authentication payload containing user credentials.
   * @returns {Promise<void>} Resolves if login is successful, otherwise throws an error.
   * @throws {AppError} Throws mapped HTTP error if login fails.
   */
  async login(payload: AuthPayload): Promise<void> {
    try {
      await axiosClient.post(API_ROUTES.LOGIN, payload);
    } catch (error) {
      clientLogger.error("Login error", { error });
      throw mapHttpError(error, Domain.LOGIN);
    }
  },

  /**
   * Logs out the current user by invalidating the session on the server.
   *
   * @returns {Promise<void>} Resolves if logout is successful, otherwise throws an error.
   * @throws {AppError} Throws mapped HTTP error if logout fails.
   */
  async logout(): Promise<void> {
    try {
      await axiosClient.post(API_ROUTES.LOGOUT);
    } catch (error) {
      clientLogger.error("Logout error", { error });
      throw mapHttpError(error, Domain.LOGOUT);
    }
  },

  /**
   * Registers a new user with the provided credentials.
   *
   * @param {AuthPayload} payload - The registration payload containing user details.
   * @returns {Promise<void>} Resolves if sign up is successful, otherwise throws an error.
   * @throws {AppError} Throws mapped HTTP error if sign up fails.
   */
  async signUp(payload: AuthPayload): Promise<void> {
    try {
      await axiosClient.post(API_ROUTES.SIGNUP, payload);
    } catch (error) {
      clientLogger.error("SignUp error", { error });
      throw mapHttpError(error, Domain.SIGNUP);
    }
  },

  /**
   * Resends the email verification link to the specified email address.
   *
   * @param {string} email - The email address to send the verification link to.
   * @returns {Promise<void>} Resolves if the email is sent successfully, otherwise throws an error.
   * @throws {AppError} Throws mapped HTTP error if the request fails.
   */
  async resendVerification(email: string): Promise<void> {
    try {
      await axiosClient.post(API_ROUTES.RESEND_VERIFICATION, { email });
    } catch (error) {
      clientLogger.error("ResendVerification error", { error });
      throw mapHttpError(error, Domain.RESEND_VERIFICATION);
    }
  },

  /**
   * Confirms a user's email address using the provided verification token.
   *
   * @param {string} token - The email verification token.
   * @returns {Promise<void>} Resolves if email confirmation is successful, otherwise throws an error.
   * @throws {AppError} Throws mapped HTTP error if confirmation fails.
   */
  async confirmEmail(token: string): Promise<void> {
    try {
      await axiosClient.post(API_ROUTES.VERIFY, { token });
    } catch (error) {
      clientLogger.error("Verify Email error", { error });
      throw mapHttpError(error, Domain.CONFIRM_EMAIL);
    }
  },

  /**
   * Checks if the current user is authenticated.
   *
   * @returns {Promise<void>} Resolves if the user is authenticated, otherwise throws an error.
   * @throws {AppError} Throws an unauthorized error if the user is not authenticated.
   */
  async checkAuthStatus(): Promise<void> {
    try {
      await axiosClient.get(API_ROUTES.AUTH_CHECK);
    } catch (error) {
      clientLogger.error("Check Auth Status error", { error });
      throw new AppError(AppErrorType.UNAUTHORIZED, "User is not authenticated");
    }
  },

  /**
   * Changes the password for the current user.
   *
   * @param {object} payload - The payload containing the new password and any required fields.
   * @returns {Promise<void>} Resolves if the password is changed successfully, otherwise throws an error.
   * @throws {AppError} Throws an authentication error if the request fails.
   */
  async changePassword(payload) {
    try {
      await axiosClient.post(API_ROUTES.CHANGE_PASSWORD, payload);
    } catch (error) {
      clientLogger.error("ChangePassword error", { error });
      throw new AppError(AppErrorType.AUTH, "Change password error");
    }
  },

  /**
   * Sends a password reset email to the specified address.
   *
   * @param {string} email - The email address to send the password reset link to.
   * @returns {Promise<void>} Resolves if the email is sent successfully, otherwise throws an error.
   * @throws {AppError} Throws an authentication error if the request fails.
   */
  async forgotPassword(email) {
    try {
      await axiosClient.post(API_ROUTES.FORGOT_PASSWORD, { email });
    } catch (error) {
      clientLogger.error("ForgotPassword error", { error });
      throw new AppError(AppErrorType.AUTH, "Forgot password error");
    }
  },
};
