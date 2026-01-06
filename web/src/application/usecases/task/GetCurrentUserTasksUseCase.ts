import type { TaskResponseDto} from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetCurrentUserTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<TaskResponseDto[]> {
    try {
      clientLogger.info("GetCurrentUserTasksUseCase: fetching tasks");

      const tasks = await this.taskRepository.findAll();

      if (tasks.length === 0) {
        clientLogger.warn("GetCurrentUserTasksUseCase: current user has no tasks");
        return [];
      }

      clientLogger.info("GetCurrentUserTasksUseCase: tasks fetched successfully", {
        tasksCount: tasks.length,
      });

      return TaskResponseMapper.fromDomainList(tasks);
    } catch (error) {
      clientLogger.error("GetCurrentUserTasksUseCase: failed", { error });
      throw error;
    }
  }
}
