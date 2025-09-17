import { Task } from "../task/task.entity";
import { User } from "./user.entity";

export type UserService = {
  getCurrentUser: () => Promise<User | null>;
  getById: (id: number) => Promise<User | null>;
  uploadAvatar: (data: FormData) => Promise<string | null>;
  updateUser: (user: Partial<User>) => Promise<User | null>;
  getTasks: () => Promise<Task[]>;
};
