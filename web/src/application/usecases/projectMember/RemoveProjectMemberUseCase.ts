import type { RemoveMemberPayload } from "@/application/payloads";
import { canUserManageMembers } from "@/domain/models/Project";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
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

      const project = await projectRepository.findById(payload.projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${payload.projectId}`);
      }

      if (!canUserManageMembers(project)) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to remove members from this project",
        );
      }

      await projectMemberRepository.removeMember(payload.projectId, payload.memberId);

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
