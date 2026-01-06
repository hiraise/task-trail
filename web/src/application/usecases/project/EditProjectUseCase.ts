import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { EditProjectPayload } from "@/application/payloads";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class EditProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(payload: EditProjectPayload): Promise<ProjectResponseDto> {
    try {
      clientLogger.info("Editing project", { projectId: payload.projectId });

      const projectId = ProjectId.create(payload.projectId);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      // Проверка прав
      if (!project.canUserEdit()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to edit this project"
        );
      }

      // Сохранение
      const updatedProject = await this.projectRepository.update(project);

      clientLogger.info("Project updated successfully", {
        projectId: updatedProject.id.value,
      });

      return ProjectResponseMapper.fromDomain(updatedProject);
    } catch (error) {
      clientLogger.error("EditProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
