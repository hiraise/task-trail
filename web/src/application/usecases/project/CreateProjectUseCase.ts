import type { ProjectResponseDto } from "@/application/dto/ProjectResponseDto";
import { mapProjectToResponse } from "@/application/dto/ProjectResponseDto";
import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type CreateProjectUseCase = (payload: CreateProjectPayload) => Promise<ProjectResponseDto>;

const createCreateProjectUseCase =
  (projectRepository: ProjectRepository): CreateProjectUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Creating new project", { name: payload.name });

      const projectId = await projectRepository.create({
        name: payload.name,
        description: payload.description,
        participants: payload.participants,
      });

      clientLogger.info("Project created successfully", { projectId: projectId.toString() });
      const createdProject = await projectRepository.findById(projectId);

      return mapProjectToResponse(createdProject);
    } catch (error) {
      clientLogger.error("CreateProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createCreateProjectUseCase, type CreateProjectUseCase };
