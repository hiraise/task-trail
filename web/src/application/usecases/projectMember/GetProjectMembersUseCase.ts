import type {
  ProjectMemberResponseDto} from "@/application/dto/ProjectMemberResponseDto";
import {
  ProjectMemberResponseMapper,
} from "@/application/dto/ProjectMemberResponseDto";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class GetProjectMembersUseCase {
  constructor(private projectMemberRepository: ProjectMemberRepository) {}

  async execute(projectId: string | number): Promise<ProjectMemberResponseDto[]> {
    try {
      clientLogger.info("GetProjectMembersUseCase: fetching members", {
        projectId,
      });

      const id = ProjectId.create(projectId);
      const members = await this.projectMemberRepository.findByProjectId(id);

      clientLogger.info("GetProjectMembersUseCase: members fetched successfully", {
        projectId,
        count: members.length,
      });

      return ProjectMemberResponseMapper.fromDomainList(members);
    } catch (error) {
      clientLogger.error("GetProjectMembersUseCase: failed", { error, projectId });
      throw error;
    }
  }
}
