import { authService } from "@/infrastructure/api/authService";
import { createLoginThunk } from "./createLoginThunk";
import { createLogoutThunk } from "./createLogoutThunk";
import { createSignUpThunk } from "./createSignUpThunk";
import { createResendVerificationThunk } from "./createResendVerificationThunk";
import { createConfirmEmailThunk } from "./createConfirmEmailThunk";

export const loginThunk = createLoginThunk(authService.login);
export const logoutThunk = createLogoutThunk(authService.logout);
export const signUpThunk = createSignUpThunk(authService.signUp);
export const resendVerificationThunk = createResendVerificationThunk(
  authService.resendVerification
);
export const confirmEmailThunk = createConfirmEmailThunk(
  authService.confirmEmail
);
