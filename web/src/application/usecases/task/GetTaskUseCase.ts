import type { TaskResponseDto} from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { TaskId } from "@/domain/valueobjects/TaskId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(taskId: string | number): Promise<TaskResponseDto | null> {
    try {
      clientLogger.info("GetTaskUseCase: fetching task", { taskId });

      const id = TaskId.create(taskId);
      const task = await this.taskRepository.findById(id);

      if (!task) {
        clientLogger.warn("GetTaskUseCase: task not found", { taskId });
        return null;
      }

      clientLogger.info("GetTaskUseCase: task fetched successfully", {
        taskId,
        name: task.title,
      });

      return TaskResponseMapper.fromDomain(task);
    } catch (error) {
      clientLogger.error("GetTaskUseCase: failed", { error, taskId });
      throw error;
    }
  }
}
