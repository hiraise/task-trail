import type {
  TaskStatusResponseDto} from "@/application/dto/TaskStatusResponseDto";
import {
  TaskStatusResponseMapper,
} from "@/application/dto/TaskStatusResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetProjectStatusesUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(projectId: string | number): Promise<TaskStatusResponseDto[]> {
    try {
      clientLogger.info("GetProjectStatusesUseCase: fetching all project statuses");

      const id = ProjectId.create(projectId);
      const statuses = await this.projectRepository.getProjectStatuses(id);

      clientLogger.info("GetProjectStatusesUseCase: project statuses fetched successfully", {
        count: statuses.length,
      });

      return TaskStatusResponseMapper.fromDomainList(statuses);
    } catch (error) {
      clientLogger.error("GetProjectStatusesUseCase: failed", { error });
      throw error;
    }
  }
}
