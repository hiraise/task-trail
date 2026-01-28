import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type DeleteProjectUseCase = (projectId: string | number) => Promise<void>;

const createDeleteProjectUseCase =
  (projectRepository: ProjectRepository): DeleteProjectUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("DeleteProjectUseCase: deleting project", { projectId });

      const id = ProjectId.create(projectId);
      const project = await projectRepository.findById(id);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${id}`);
      }

      if (!project.canUserDelete()) {
        throw new AppError(AppErrorType.FORBIDDEN, "Only owner can delete project");
      }

      await projectRepository.delete(id);

      clientLogger.info("DeleteProjectUseCase: project deleted successfully", {
        projectId,
      });
    } catch (error) {
      clientLogger.error("DeleteProjectUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createDeleteProjectUseCase, type DeleteProjectUseCase };
