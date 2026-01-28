import type { RemoveMemberPayload } from "@/application/payloads";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { ProjectMemberId } from "@/domain/valueobjects/ProjectMemberId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type RemoveProjectMemberUseCase = (payload: RemoveMemberPayload) => Promise<void>;

const createRemoveProjectMemberUseCase =
  (
    projectMemberRepository: ProjectMemberRepository,
    projectRepository: ProjectRepository,
  ): RemoveProjectMemberUseCase =>
  async (payload) => {
    try {
      clientLogger.info("RemoveProjectMemberUseCase: removing member", {
        projectId: payload.projectId,
        memberId: payload.memberId,
      });

      const projectId = ProjectId.create(payload.projectId);
      const project = await projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      if (!project.canUserManageMembers()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to remove members from this project",
        );
      }

      const memberId = ProjectMemberId.create(payload.memberId);
      await projectMemberRepository.removeMember(projectId, memberId);

      clientLogger.info("RemoveProjectMemberUseCase: member removed successfully", {
        projectId: payload.projectId,
        memberId: payload.memberId,
      });
    } catch (error) {
      clientLogger.error("RemoveProjectMemberUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createRemoveProjectMemberUseCase, type RemoveProjectMemberUseCase };
