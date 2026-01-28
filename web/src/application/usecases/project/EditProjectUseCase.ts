import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { mapProjectToResponse } from "@/application/dto/ProjectResponseDto";
import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type EditProjectUseCase = (payload: EditProjectPayload) => Promise<ProjectResponseDto>;

const createEditProjectUseCase =
  (projectRepository: ProjectRepository): EditProjectUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Editing project", { projectId: payload.projectId });

      const projectId = ProjectId.create(payload.projectId);
      const project = await projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      // Проверка прав
      if (!project.canUserEdit()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to edit this project",
        );
      }

      // Сохранение
      const updatedProject = await projectRepository.update(project);

      clientLogger.info("Project updated successfully", {
        projectId: updatedProject.id.value,
      });

      return mapProjectToResponse(updatedProject);
    } catch (error) {
      clientLogger.error("EditProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createEditProjectUseCase, type EditProjectUseCase };
