import type { AddMembersPayload } from "@/application/payloads";
import { canUserInviteMembers } from "@/domain/models/Project";
import { projectMemberRepository, projectRepository } from "@/infrastructure/repositories";
import { AppError, AppErrorType } from "@/shared/errors/types";

export async function addProjectMembersUseCase(payload: AddMembersPayload): Promise<void> {
  const project = await projectRepository.findById(payload.projectId);

  if (!project) {
    throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${payload.projectId}`);
  }

  if (!canUserInviteMembers(project)) {
    throw new AppError(
      AppErrorType.FORBIDDEN,
      "You do not have permission to invite members to this project",
    );
  }

  try {
    await projectMemberRepository.addByEmails(payload.projectId, payload.emails);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      AppErrorType.UNKNOWN,
      `Failed to add ${payload.emails.length} members to project ${payload.projectId}`,
    );
  }
}
