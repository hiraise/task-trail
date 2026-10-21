export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface EmailPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password: string;
  token: string;
}

export interface VerifyEmailPayload {
  token: string;
}
