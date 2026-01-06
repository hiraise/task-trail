import type { EditProjectCommand } from "@/application/commands/project/EditProjectCommand";
import type { ProjectResponseDto} from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class EditProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(command: EditProjectCommand): Promise<ProjectResponseDto> {
    try {
      clientLogger.info("Editing project", { projectId: command.projectId });

      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId);

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

      // Валидация и обновление
      if (command.name !== undefined) {
        this.validateName(command.name);
        project.name = command.name;
      }

      if (command.description !== undefined) {
        this.validateDescription(command.description);
        project.description = command.description;
      }

      // Сохранение
      const updatedProject = await this.projectRepository.update(project);

      clientLogger.info("Project updated successfully", {
        projectId: updatedProject.id.value,
      });

      return ProjectResponseMapper.fromDomain(updatedProject);
    } catch (error) {
      clientLogger.error("EditProjectUseCase: failed", { error, command });
      throw error;
    }
  }

  private validateName(name: string): void {
    if (name.trim().length < 3) {
      throw new AppError(AppErrorType.VALIDATION, "Project name must be at least 3 characters");
    }

    if (name.length > 100) {
      throw new AppError(AppErrorType.VALIDATION, "Project name must not exceed 100 characters");
    }
  }

  private validateDescription(description: string): void {
    if (description.length > 1000) {
      throw new AppError(
        AppErrorType.VALIDATION,
        "Project description must not exceed 1000 characters",
      );
    }
  }
}
