export interface AuthPayload {
  email: string;
  password: string;
}

export type ChangePasswordPayload = {
  newPassword: string;
  oldPassword: string;
};
