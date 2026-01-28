import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectUseCase = (projectId: string | number) => Promise<ProjectResponseDto | null>;

const createGetProjectUseCase =
  (projectRepository: ProjectRepository): GetProjectUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectUseCase: fetching project", { projectId });

      const id = ProjectId.create(projectId);
      const project = await projectRepository.findById(id);

      if (!project) {
        clientLogger.warn("GetProjectUseCase: project not found", { projectId });
        return null;
      }

      clientLogger.info("GetProjectUseCase: project fetched successfully", {
        projectId,
        name: project.name,
      });

      return ProjectResponseMapper.fromDomain(project);
    } catch (error) {
      clientLogger.error("GetProjectUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createGetProjectUseCase, type GetProjectUseCase };
