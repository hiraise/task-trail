import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class DeleteTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string | number): Promise<void> {
    try {
      clientLogger.info("DeleteTaskUseCase: deleting task", { taskId });

      const id = TaskId.create(taskId);
      const task = await this.taskRepository.findById(id);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${id}`);
      }

      // TODO: add check rights to delete task

      await this.taskRepository.delete(id);

      clientLogger.info("DeleteTaskUseCase: task deleted successfully", { taskId });
    } catch (error) {
      clientLogger.error("DeleteTaskUseCase: failed", { error, taskId });
      throw error;
    }
  }
}
