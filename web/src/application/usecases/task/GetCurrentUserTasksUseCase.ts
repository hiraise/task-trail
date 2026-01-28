import type { TaskResponseDto } from "@/application/dto/TaskResponseDto";
import { mapTasksToResponse } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetCurrentUserTasksUseCase = () => Promise<TaskResponseDto[]>;

const createGetCurrentUserTasksUseCase =
  (taskRepository: TaskRepository): GetCurrentUserTasksUseCase =>
  async () => {
    try {
      clientLogger.info("GetCurrentUserTasksUseCase: fetching tasks");

      const tasks = await taskRepository.findAll();

      if (tasks.length === 0) {
        clientLogger.warn("GetCurrentUserTasksUseCase: current user has no tasks");
        return [];
      }

      clientLogger.info("GetCurrentUserTasksUseCase: tasks fetched successfully", {
        tasksCount: tasks.length,
      });

      return mapTasksToResponse(tasks);
    } catch (error) {
      clientLogger.error("GetCurrentUserTasksUseCase: failed", { error });
      throw error;
    }
  };

export { createGetCurrentUserTasksUseCase, type GetCurrentUserTasksUseCase };
