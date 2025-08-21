import { Task } from "../task/task.entity";
import { TaskPayload } from "./task.payload";

export type NewTask = (payload: TaskPayload) => Promise<Task>;

export type TaskService = {
  create: NewTask;
};
