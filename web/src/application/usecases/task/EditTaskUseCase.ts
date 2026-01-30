import type { EditTaskPayload } from "@/application/payloads";
import type { Task } from "@/domain/models/Task";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type EditTaskUseCase = (payload: EditTaskPayload) => Promise<Task>;

const createEditTaskUseCase =
  (taskRepository: TaskRepository): EditTaskUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Editing task", { taskId: payload.taskId });

      const task = await taskRepository.findById(payload.taskId);

      if (!task) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${payload.taskId}`);
      }

      // TODO: Add check rights to edit task

      // Saving
      const updatedTask = await taskRepository.update(task);

      clientLogger.info("Task updated successfully", { taskID: updatedTask.id });

      return updatedTask;
    } catch (error) {
      clientLogger.error("EditTaskUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createEditTaskUseCase, type EditTaskUseCase };
