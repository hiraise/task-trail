import type { ProjectDetails } from "@/domain/models/Project";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { ProjectId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectUseCase = (projectId: ProjectId) => Promise<ProjectDetails | null>;

const createGetProjectUseCase =
  (projectRepository: ProjectRepository): GetProjectUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectUseCase: fetching project", { projectId });

      const project = await projectRepository.findById(projectId);

      if (!project) {
        clientLogger.warn("GetProjectUseCase: project not found", { projectId });

        return null;
      }

      clientLogger.info("GetProjectUseCase: project fetched successfully", {
        projectId,
        name: project.name,
      });

      return project;
    } catch (error) {
      clientLogger.error("GetProjectUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createGetProjectUseCase, type GetProjectUseCase };
