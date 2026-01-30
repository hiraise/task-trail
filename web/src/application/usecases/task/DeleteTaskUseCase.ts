import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import type { TaskId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type DeleteTaskUseCase = (taskId: TaskId) => Promise<void>;

const createDeleteTaskUseCase =
  (taskRepository: TaskRepository): DeleteTaskUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("DeleteTaskUseCase: deleting task", { taskId });

      const task = await taskRepository.findById(taskId);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${taskId}`);
      }

      // TODO: add check rights to delete task

      await taskRepository.delete(taskId);

      clientLogger.info("DeleteTaskUseCase: task deleted successfully", { taskId });
    } catch (error) {
      clientLogger.error("DeleteTaskUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createDeleteTaskUseCase, type DeleteTaskUseCase };
