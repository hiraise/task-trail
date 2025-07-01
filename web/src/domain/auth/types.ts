export interface AuthPayload {
  email: string;
  password: string;
}

export type ChangePasswordPayload = {
  newPassword: string;
  oldPassword: string;
};

export type Login = (payload: AuthPayload) => Promise<void>;
export type Logout = () => Promise<void>;
export type SignUp = (payload: AuthPayload) => Promise<void>;
export type ResendVerification = (email: string) => Promise<void>;
export type ConfirmEmail = (token: string) => Promise<void>;
export type CheckAuthStatus = () => Promise<void>;
export type ChangePassword = (payload: ChangePasswordPayload) => Promise<void>;

export type AuthService = {
  login: Login;
  logout: Logout;
  signUp: SignUp;
  resendVerification: ResendVerification;
  confirmEmail: ConfirmEmail;
  checkAuthStatus: CheckAuthStatus;
  changePassword: ChangePassword;
};
