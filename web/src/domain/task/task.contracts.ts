import { Task } from "../task/task.entity";
import {
  ChangeAssigneePayload,
  ChangeStatusPayload,
  EditTaskPayload,
  TaskPayload,
} from "./task.payload";

export type TaskService = {
  create: (payload: TaskPayload) => Promise<number>;
  delete: (id: number) => Promise<void>;
  getTask: (id: number) => Promise<Task>;
  changeStatus: (payload: ChangeStatusPayload) => Promise<void>;
  changeAssignee: (payload: ChangeAssigneePayload) => Promise<void>;
  editTask: (id: number, payload: EditTaskPayload) => Promise<void>;
};
