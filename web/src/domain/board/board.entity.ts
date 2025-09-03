import { User } from "../user/user.entity";

export interface Board {
  id: number;
  name: string;
  taskCount: number;
  members: User[];
}
