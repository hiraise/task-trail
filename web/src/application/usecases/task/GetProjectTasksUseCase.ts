import type { TaskResponseDto} from "@/application/dto/TaskResponseDto";
import { TaskResponseMapper } from "@/application/dto/TaskResponseDto";
import type { TaskRepository } from "@/domain/repositories/TaskRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetProjectTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(projectId: string | number): Promise<TaskResponseDto[]> {
    try {
      clientLogger.info("GetProjectTasksUseCase: fetching all project tasks");

      const id = ProjectId.create(projectId);
      const tasks = await this.taskRepository.findByProjectId(id);

      clientLogger.info("GetProjectTasksUseCase: project tasks fetched successfully", {
        count: tasks.length,
      });

      return TaskResponseMapper.fromDomainList(tasks);
    } catch (error) {
      clientLogger.error("GetProjectTasksUseCase: failed", { error });
      throw error;
    }
  }
}
