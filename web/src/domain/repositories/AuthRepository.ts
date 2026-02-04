export interface AuthRepository {
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  signUp(email: string, password: string): Promise<void>;
  checkAuthStatus(): Promise<void>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  forgotPassword(email: string): Promise<string>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  resendEmailVerification(email: string): Promise<string>;
  verifyEmail(token: string): Promise<void>;
}
