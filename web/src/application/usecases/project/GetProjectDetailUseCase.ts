import type { ProjectDetailResponseDto } from "@/application/dto/ProjectDetailResponseDto";
import { createProjectMember, isProjectMemberOwner } from "@/domain/models/ProjectMember";
import { createUser } from "@/domain/models/User";
import type { ProjectId } from "@/domain/types";
import {
  projectMemberRepository,
  projectRepository,
  taskRepository,
} from "@/infrastructure/repositories";

export async function getProjectDetailUseCase(
  projectId: ProjectId,
): Promise<ProjectDetailResponseDto> {
  const [project, members, tasks] = await Promise.all([
    projectRepository.findById(projectId),
    projectMemberRepository.findByProjectId(projectId),
    taskRepository.findByProjectId(projectId),
  ]);

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const ownerMember = members.find(isProjectMemberOwner);

  if (!ownerMember) {
    throw new Error(`Project owner not found: ${projectId}`);
  }

  return {
    project: project,
    members: members.map(createProjectMember),
    owner: createUser(ownerMember),
    tasks: tasks,
  };
}
