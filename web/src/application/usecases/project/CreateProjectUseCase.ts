import type { CreateProjectPayload } from "@/application/payloads";
import type { ProjectDetails } from "@/domain/models/Project";
import { projectRepository } from "@/infrastructure/repositories";

export async function createProjectUseCase(payload: CreateProjectPayload): Promise<ProjectDetails> {
  const projectId = await projectRepository.create({
    name: payload.name,
    description: payload.description,
    participants: payload.participants,
  });

  const createdProject = await projectRepository.findById(projectId);

  return createdProject;
}
