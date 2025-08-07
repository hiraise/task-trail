import { authService } from "@/infrastructure/api/authService";
import { createLoginThunk } from "./createLoginThunk";
import { createLogoutThunk } from "./createLogoutThunk";
import { createSignUpThunk } from "./createSignUpThunk";
import { createResendVerificationThunk } from "./createResendVerificationThunk";
import { createConfirmEmailThunk } from "./createConfirmEmailThunk";
import { createCheckAuthStatusThunk } from "./createCheckAuthStatusThunk";
import { userService } from "@/infrastructure/api/userService";
import { createForgotPasswordThunk } from "./createForgotPasswordThunk";

export const loginThunk = createLoginThunk(authService.login, userService.getCurrentUser);
export const logoutThunk = createLogoutThunk(authService.logout);
export const signUpThunk = createSignUpThunk(authService.signUp);
export const resendVerificationThunk = createResendVerificationThunk(
  authService.resendVerification
);
export const confirmEmailThunk = createConfirmEmailThunk(authService.confirmEmail);
export const checkAuthStatusThunk = createCheckAuthStatusThunk(authService.checkAuthStatus);
export const forgotPasswordThunk = createForgotPasswordThunk(authService.forgotPassword);
