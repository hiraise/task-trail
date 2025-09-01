import { User } from "./user.entity";

export type UserService = {
  getCurrentUser: () => Promise<User | null>;
  uploadAvatar: (data: FormData) => Promise<string | null>;
  updateUser: (user: Partial<User>) => Promise<User | null>;
};
