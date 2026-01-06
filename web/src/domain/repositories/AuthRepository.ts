import type { Email } from "../valueobjects/Email";

export interface AuthRepository {
  login(email: Email, password: string): Promise<void>;
  logout(): Promise<void>;
  signUp(email: Email, password: string): Promise<void>;
  checkAuthStatus(): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: Email): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  resendEmailVerification(email: Email): Promise<void>;
  verifyEmail(token: string): Promise<void>;
}
