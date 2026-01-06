import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { ProjectResponseMapper } from "@/application/dto/ProjectResponseDto";
import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class CreateProjectUseCase {
  constructor(private projectRepository: ProjectRepository) {}

  async execute(payload: CreateProjectPayload): Promise<ProjectResponseDto> {
    try {
      clientLogger.info("Creating new project", { name: payload.name });

      const projectId = await this.projectRepository.create({
        name: payload.name,
        description: payload.description,
        participants: payload.participants,
      });

      clientLogger.info("Project created successfully", { projectId: projectId.toString() });
      const createdProject = await this.projectRepository.findById(projectId);

      return ProjectResponseMapper.fromDomain(createdProject);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
