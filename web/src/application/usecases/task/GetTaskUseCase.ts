import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { mapTaskToResponse } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetTaskUseCase = (taskId: string | number) => Promise<TaskResponseDto | null>;

const createGetTaskUseCase =
  (taskRepository: TaskRepository): GetTaskUseCase =>
  async (taskId) => {
    try {
      clientLogger.info("GetTaskUseCase: fetching task", { taskId });

      const id = TaskId.create(taskId);
      const task = await taskRepository.findById(id);

      if (!task) {
        clientLogger.warn("GetTaskUseCase: task not found", { taskId });
        return null;
      }

      clientLogger.info("GetTaskUseCase: task fetched successfully", {
        taskId,
        name: task.title,
      });

      return mapTaskToResponse(task);
    } catch (error) {
      clientLogger.error("GetTaskUseCase: failed", { error, taskId });
      throw error;
    }
  };

export { createGetTaskUseCase, type GetTaskUseCase };
