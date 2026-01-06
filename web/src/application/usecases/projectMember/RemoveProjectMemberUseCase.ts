import type { RemoveProjectMemberCommand } from "@/application/commands/projectMember/RemoveProjectMemberCommand";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { ProjectMemberId } from "@/domain/valueobjects/ProjectMemberId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class RemoveProjectMemberUseCase {
  constructor(
    private projectMemberRepository: ProjectMemberRepository,
    private projectRepository: ProjectRepository,
  ) {}

  async execute(command: RemoveProjectMemberCommand): Promise<void> {
    try {
      clientLogger.info("RemoveProjectMemberUseCase: removing member", {
        projectId: command.projectId,
        memberId: command.memberId,
      });

      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      if (!project.canUserManageMembers()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to remove members from this project",
        );
      }

      const memberId = ProjectMemberId.create(command.memberId);
      await this.projectMemberRepository.removeMember(projectId, memberId);

      clientLogger.info("RemoveProjectMemberUseCase: member removed successfully", {
        projectId: command.projectId,
        memberId: command.memberId,
      });
    } catch (error) {
      clientLogger.error("RemoveProjectMemberUseCase: failed", { error, command });
      throw error;
    }
  }
}
