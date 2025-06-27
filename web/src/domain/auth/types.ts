export interface AuthPayload {
  email: string;
  password: string;
}

export type Login = (payload: AuthPayload) => Promise<void>;
export type Logout = () => Promise<void>;
export type SignUp = (payload: AuthPayload) => Promise<void>;
export type ResendVerification = (email: string) => Promise<void>;
export type ConfirmEmail = (token: string) => Promise<void>;
export type CheckAuthStatus = () => Promise<void>;

export type AuthService = {
  login: Login;
  logout: Logout;
  signUp: SignUp;
  resendVerification: ResendVerification;
  confirmEmail: ConfirmEmail;
  checkAuthStatus: CheckAuthStatus;
};
