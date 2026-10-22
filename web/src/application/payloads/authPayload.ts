export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface FirstAccountPayload {
  email: string;
  password: string;
  username: string;
}

export interface AcceptInvitationPayload {
  token: string;
  username: string;
  password: string;
}

export interface EmailPayload {
  email: string;
}

export interface ResetPasswordPayload {
  password: string;
  token: string;
}
