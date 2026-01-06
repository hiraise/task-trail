import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetProjectsUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(): Promise<ProjectResponseDto[]> {
    try {
      clientLogger.info("GetProjectsUseCase: fetching all projects");

      const projects = await this.projectRepository.findAll();

      clientLogger.info("GetProjectsUseCase: projects fetched successfully", {
        count: projects.length,
      });

      return ProjectResponseMapper.fromDomainList(projects);
    } catch (error) {
      clientLogger.error("GetProjectsUseCase: failed", { error });
      throw error;
    }
  }
}
