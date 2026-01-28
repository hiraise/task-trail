import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { mapProjectsToResponse } from "@/application/dto/ProjectResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectsUseCase = () => Promise<ProjectResponseDto[]>;

const createGetProjectsUseCase =
  (projectRepository: ProjectRepository): GetProjectsUseCase =>
  async () => {
    try {
      clientLogger.info("GetProjectsUseCase: fetching all projects");

      const projects = await projectRepository.findAll();

      clientLogger.info("GetProjectsUseCase: projects fetched successfully", {
        count: projects.length,
      });

      return mapProjectsToResponse(projects);
    } catch (error) {
      clientLogger.error("GetProjectsUseCase: failed", { error });
      throw error;
    }
  };

export { createGetProjectsUseCase, type GetProjectsUseCase };
