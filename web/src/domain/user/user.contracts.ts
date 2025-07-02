import { User } from "./user.entity";

export type GetCurrentUser = () => Promise<User | null>;
export type UploadAvatar = (data: FormData) => Promise<string | null>;
export type UpdateUser = (user: Partial<User>) => Promise<User | null>;

export type UserService = {
  getCurrentUser: GetCurrentUser;
  uploadAvatar: UploadAvatar;
  updateUser: UpdateUser;
};
