import { Task } from "../task/task.entity";
import { TaskPayload } from "./task.payload";

export type TaskService = {
  create: (payload: TaskPayload) => Promise<number>;
  getTask: (id: number) => Promise<Task>;
};
