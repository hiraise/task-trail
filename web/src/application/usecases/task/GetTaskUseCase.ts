import type { Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { TaskId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetTaskUseCase = (taskId: TaskId) => Promise<Task | null>;

const createGetTaskUseCase =
  (taskRepository: TaskRepository): GetTaskUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("GetTaskUseCase: fetching task", { taskId });

      const task = await taskRepository.findById(taskId);

      if (!task) {
        clientLogger.warn("GetTaskUseCase: task not found", { taskId });
        return null;
      }

      clientLogger.info("GetTaskUseCase: task fetched successfully", {
        taskId,
        name: task.name,
      });

      return task;
    } catch (error) {
      clientLogger.error("GetTaskUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createGetTaskUseCase, type GetTaskUseCase };
