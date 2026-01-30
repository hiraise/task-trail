import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { canUserEditProject } from "@/domain/models/Project";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type EditProjectUseCase = (payload: EditProjectPayload) => Promise<ProjectDetails>;

const createEditProjectUseCase =
  (projectRepository: ProjectRepository): EditProjectUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Editing project", { projectId: payload.projectId });
      const project = await projectRepository.findById(payload.projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${payload.projectId}`);
      }

      // Проверка прав
      if (!canUserEditProject(project)) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to edit this project",
        );
      }

      // Сохранение
      const updatedProject = await projectRepository.update({
        projectId: payload.projectId,
        name: payload.name ?? "",
        description: payload.description,
      });

      clientLogger.info("Project updated successfully", {
        projectId: updatedProject.id,
      });

      return updatedProject;
    } catch (error) {
      clientLogger.error("EditProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createEditProjectUseCase, type EditProjectUseCase };
