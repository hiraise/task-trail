import type { LeaveProjectCommand } from "@/application/commands/projectMember/LeaveProjectCommand";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class LeaveProjectUseCase {
  constructor(private projectMemberRepository: ProjectMemberRepository) {}

  async execute(command: LeaveProjectCommand): Promise<ProjectId> {
    try {
      clientLogger.info("LeaveProjectUseCase: leaving project", {
        projectId: command.projectId,
      });

      const projectId = ProjectId.create(command.projectId);
      await this.projectMemberRepository.leaveProject(projectId);

      clientLogger.info("LeaveProjectUseCase: left project successfully", {
        projectId: command.projectId,
      });

      return projectId;
    } catch (error) {
      clientLogger.error("LeaveProjectUseCase: failed", { error, command });
      throw error;
    }
  }
}
