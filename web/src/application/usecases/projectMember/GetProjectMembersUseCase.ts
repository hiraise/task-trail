import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import { mapProjectMembersToResponse } from "@/application/dto/ProjectMemberResponseDto";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type GetProjectMembersUseCase = (projectId: string | number) => Promise<ProjectMemberResponseDto[]>;

const createGetProjectMembersUseCase =
  (projectMemberRepository: ProjectMemberRepository): GetProjectMembersUseCase =>
  async (projectId) => {
    try {
      clientLogger.info("GetProjectMembersUseCase: fetching members", {
        projectId,
      });

      const id = ProjectId.create(projectId);
      const members = await projectMemberRepository.findByProjectId(id);

      clientLogger.info("GetProjectMembersUseCase: members fetched successfully", {
        projectId,
        count: members.length,
      });

      return mapProjectMembersToResponse(members);
    } catch (error) {
      clientLogger.error("GetProjectMembersUseCase: failed", { error, projectId });
      throw error;
    }
  };

export { createGetProjectMembersUseCase, type GetProjectMembersUseCase };
