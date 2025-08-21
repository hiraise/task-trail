import { NewTask, TaskService } from "@/domain/task/task.contracts";
import axiosClient from "./axiosClient";
import { API_ROUTES } from "../config/apiRoutes";
import { clientLogger } from "../config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

//TODO: replace return data with fetching new task from backend

const create: NewTask = async (payload) => {
  try {
    const result = await axiosClient.post(API_ROUTES.TASKS, payload);
    return {
      id: result.data,
      title: payload.name,
      description: payload.description,
      statusId: 1,
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString(),
      projectId: payload.projectId,
      authorId: 1,
      assigneeId: payload.assigneeId,
    };
  } catch (error) {
    clientLogger.error("Failed to create task", { error, payload });
    throw new AppError(AppErrorType.SERVER, "Failed to create task");
  }
};

export const taskService: TaskService = {
  create: create,
};
