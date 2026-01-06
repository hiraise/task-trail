import type { LeaveProjectPayload } from "@/application/payloads";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class LeaveProjectUseCase {
  constructor(private projectMemberRepository: ProjectMemberRepository) {}

  async execute(payload: LeaveProjectPayload): Promise<ProjectId> {
    try {
      clientLogger.info("LeaveProjectUseCase: leaving project", {
        projectId: payload.projectId,
      });

      const projectId = ProjectId.create(payload.projectId);
      await this.projectMemberRepository.leaveProject(projectId);

      clientLogger.info("LeaveProjectUseCase: left project successfully", {
        projectId: payload.projectId,
      });

      return projectId;
    } catch (error) {
      clientLogger.error("LeaveProjectUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
