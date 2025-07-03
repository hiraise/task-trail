export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export type FormValues = ChangePasswordData & {
  confirmPassword: string;
};
