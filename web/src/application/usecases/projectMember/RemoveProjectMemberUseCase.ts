import type { RemoveMemberPayload } from "@/application/payloads";
import { canUserManageMembers } from "@/domain/models/Project";
import { projectMemberRepository, projectRepository } from "@/infrastructure/repositories";
import { AppError, AppErrorType } from "@/shared/errors/types";

export async function removeProjectMemberUseCase(payload: RemoveMemberPayload): Promise<void> {
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

  try {
    await projectMemberRepository.removeMember(payload.projectId, payload.memberId);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      AppErrorType.UNKNOWN,
      `Failed to remove member ${payload.memberId} from project ${payload.projectId}`,
    );
  }
}
