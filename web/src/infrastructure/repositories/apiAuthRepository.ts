import type { AuthRepository } from "@/domain/repositories/AuthRepository";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

//TODO: add propper error handler
const handleError = (message: string, error: unknown): AppError => {
  if (error instanceof AppError) return error;

  return new AppError(AppErrorType.SERVER, message);
};

const createAuthRepository = (httpClient: HttpClient): AuthRepository => ({
  /**
   * Attempts to log in a user with the provided email and password.
   *
   * Sends a POST request to the login API endpoint with the user's credentials.
   * If the login fails, logs the error and throws a handled error.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @throws Will throw an error if the login request fails.
   */
  login: async (email: string, password: string): Promise<void> => {
    try {
      await httpClient.post(API_ROUTES.LOGIN, { email, password });
    } catch (error) {
      throw handleError("Failed to login", error);
    }
  },

  /**
   * Logs out the current user by sending a logout request to the API.
   *
   * @returns {Promise<void>} A promise that resolves when the logout is complete.
   * @throws Will throw an error if the logout request fails.
   */
  logout: async (): Promise<void> => {
    try {
      await httpClient.post(API_ROUTES.LOGOUT);
    } catch (error) {
      throw handleError("Failed to logout", error);
    }
  },

  /**
   * Registers a new user with the provided email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A promise that resolves when the sign-up process is complete.
   * @throws Will throw an error if the sign-up request fails.
   */
  signUp: async (email: string, password: string): Promise<void> => {
    try {
      await httpClient.post(API_ROUTES.SIGNUP, { email, password });
    } catch (error) {
      throw handleError("Failed to signup", error);
    }
  },

  /**
   * Checks the authentication status of the current user by making a request to the authentication endpoint.
   *
   * @throws {AppError} Throws an `AppError` of type `UNAUTHORIZED` if the user is not authenticated.
   * @returns {Promise<void>} Resolves if the user is authenticated; otherwise, rejects with an error.
   */
  checkAuthStatus: async (): Promise<void> => {
    try {
      await httpClient.get(API_ROUTES.AUTH_CHECK);
    } catch (error) {
      throw new AppError(AppErrorType.UNAUTHORIZED, "User is not authenticated");
    }
  },

  /**
   * Changes the password for a user.
   *
   * @param userId - The unique identifier of the user whose password is to be changed.
   * @param oldPassword - The user's current password.
   * @param newPassword - The new password to set for the user.
   * @returns A promise that resolves when the password has been successfully changed.
   * @throws Throws an error if the password change fails.
   */
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await httpClient.post<{ newPassword: string; oldPassword: string }>(
        API_ROUTES.CHANGE_PASSWORD,
        { newPassword, oldPassword },
      );
    } catch (error) {
      throw handleError("Failed to change password", error);
    }
  },

  /**
   * Initiates the forgot password process by sending a request to the API with the user's email.
   *
   * Sends a POST request to the forgot password API endpoint with the email address.
   * If the request succeeds, returns the email; otherwise, throws a handled error.
   *
   * @param email - The email address of the user who forgot their password.
   * @returns A promise that resolves with the email address if the request is successful.
   * @throws Will throw an error if the forgot password request fails.
   */
  forgotPassword: async (email: string): Promise<string> => {
    try {
      await httpClient.post(API_ROUTES.FORGOT_PASSWORD, { email });

      return email;
    } catch (error) {
      throw handleError("Forgot password error", error);
    }
  },

  /**
   * Resets the user's password using a provided token and new password.
   *
   * Sends a POST request to the reset password API endpoint with the token and new password.
   * If the request fails, logs the error and throws a handled error.
   *
   * @param token - The password reset token received by the user.
   * @param newPassword - The new password to set for the user.
   * @returns A promise that resolves when the password has been reset.
   * @throws Will throw an error if the password reset request fails.
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    try {
      const payload = { password: newPassword, token };

      await httpClient.post<{ password: string; token: string }>(
        API_ROUTES.RESET_PASSWORD,
        payload,
      );
    } catch (error) {
      throw handleError("Reset password error", error);
    }
  },

  /**
   * Sends a request to resend the email verification link to the specified email address.
   *
   * @param email - The email address to which the verification link should be resent.
   * @returns A promise that resolves with the email address when the request is complete.
   * @throws Will throw an error if the resend verification request fails.
   */
  resendEmailVerification: async (email: string): Promise<string> => {
    try {
      await httpClient.post(API_ROUTES.RESEND_VERIFICATION, { email });

      return email;
    } catch (error) {
      throw handleError("Resend verification error", error);
    }
  },

  /**
   * Verifies a user's email address using the provided token.
   *
   * Sends a POST request to the verification API endpoint with the token.
   * If the request fails, logs the error and throws a handled error.
   *
   * @param token - The email verification token to be validated.
   * @throws Will throw an error if the verification request fails.
   */
  verifyEmail: async (token: string): Promise<void> => {
    try {
      await httpClient.post(API_ROUTES.VERIFY, { token });
    } catch (error) {
      throw handleError("Verify email error", error);
    }
  },
});

export const authRepository: AuthRepository = createAuthRepository(axiosClient);
