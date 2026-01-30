import { canUserDeleteProject } from "@/domain/models/Project";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import type { ProjectId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type DeleteProjectUseCase = (projectId: ProjectId) => Promise<void>;

const createDeleteProjectUseCase =
  (projectRepository: ProjectRepository): DeleteProjectUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("DeleteProjectUseCase: deleting project", { projectId });

      const project = await projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      if (!canUserDeleteProject(project)) {
        throw new AppError(AppErrorType.FORBIDDEN, "Only owner can delete project");
      }

      await projectRepository.delete(projectId);

      clientLogger.info("DeleteProjectUseCase: project deleted successfully", { projectId });
    } catch (error) {
      clientLogger.error("DeleteProjectUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createDeleteProjectUseCase, type DeleteProjectUseCase };
