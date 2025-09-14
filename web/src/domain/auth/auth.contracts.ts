import { AuthPayload, ChangePasswordPayload, PasswordResetPayload } from "./auth.payload";

export type AuthService = {
  login: (payload: AuthPayload) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (payload: AuthPayload) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  passwordReset: (payload: PasswordResetPayload) => Promise<void>;
};
