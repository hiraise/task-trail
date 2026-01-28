import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type DeleteTaskUseCase = (taskId: string | number) => Promise<void>;

const createDeleteTaskUseCase =
  (taskRepository: TaskRepository): DeleteTaskUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("DeleteTaskUseCase: deleting task", { taskId });

      const id = TaskId.create(taskId);
      const task = await taskRepository.findById(id);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${id}`);
      }

      // TODO: add check rights to delete task

      await taskRepository.delete(id);

      clientLogger.info("DeleteTaskUseCase: task deleted successfully", { taskId });
    } catch (error) {
      clientLogger.error("DeleteTaskUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createDeleteTaskUseCase, type DeleteTaskUseCase };
