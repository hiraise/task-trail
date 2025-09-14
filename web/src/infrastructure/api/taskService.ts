import { TaskService } from "@/domain/task/task.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { mapProjectTasksFromApi } from "./taskMapper";

export const taskService: TaskService = {
  async create(payload) {
    try {
      const result = await axiosClient.post(API_ROUTES.TASKS, payload);
      return result.data.id;
    } catch (error) {
      clientLogger.error("Failed to create task", { error, payload });
      throw new AppError(AppErrorType.SERVER, "Failed to create task");
    }
  },

  async getTask(id) {
    try {
      const result = await axiosClient.get(API_ROUTES.TASKS_BY_ID(id));
      return mapProjectTasksFromApi(result.data);
    } catch (error) {
      clientLogger.error("Failed to fetch task", { error, id });
      throw new AppError(AppErrorType.SERVER, "Failed to fetch task");
    }
  },
};
