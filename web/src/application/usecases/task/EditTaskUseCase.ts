import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { mapTaskToResponse } from "@/application/dto/TaskResponseDto";
import type { EditTaskPayload } from "@/application/payloads";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type EditTaskUseCase = (payload: EditTaskPayload) => Promise<TaskResponseDto>;

const createEditTaskUseCase =
  (taskRepository: TaskRepository): EditTaskUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Editing task", { taskId: payload.taskId });

      const taskId = TaskId.create(payload.taskId);
      const task = await taskRepository.findById(taskId);

      if (!taskId) {
        throw new AppError(AppErrorType.NOT_FOUND, `Task not found: ${taskId}`);
      }

      // TODO: Add check rights to edit task

      // Saving
      const updatedTask = await taskRepository.update(task);

      clientLogger.info("Task updated successfully", { taskID: updatedTask.id.value });

      return mapTaskToResponse(updatedTask);
    } catch (error) {
      clientLogger.error("EditTaskUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createEditTaskUseCase, type EditTaskUseCase };
