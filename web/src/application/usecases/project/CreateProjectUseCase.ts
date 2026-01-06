import type { CreateProjectCommand } from "@/application/commands/project/CreateProjectCommand";
import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class CreateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(command: CreateProjectCommand): Promise<ProjectResponseDto> {
    try {
      clientLogger.info("Creating new project", { name: command.name });
      this.validateCommand(command);

      const projectId = await this.projectRepository.create({
        name: command.name,
        description: command.description,
        participants: command.participants,
      });

      clientLogger.info("Project created successfully", { projectId: projectId.toString() });
      const createdProject = await this.projectRepository.findById(projectId);

      return ProjectResponseMapper.fromDomain(createdProject);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command });
      throw error;
    }
  }

  private validateCommand(command: CreateProjectCommand): void {
    if (!command.name || command.name.trim().length < 3) {
      throw new AppError(AppErrorType.VALIDATION, "Project name must be at least 3 characters");
    }

    if (command.name.length > 100) {
      throw new AppError(AppErrorType.VALIDATION, "Project name must not exceed 100 characters");
    }

    if (command.description && command.description.length > 1000) {
      throw new AppError(
        AppErrorType.VALIDATION,
        "Project description must not exceed 1000 characters"
      );
    }
  }
}
