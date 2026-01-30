import type { AddMembersPayload } from "@/application/payloads";
import { canUserInviteMembers } from "@/domain/models/Project";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

type AddProjectMembersUseCase = (payload: AddMembersPayload) => Promise<void>;

const createAddProjectMembersUseCase =
  (
    projectMemberRepository: ProjectMemberRepository,
    projectRepository: ProjectRepository,
  ): AddProjectMembersUseCase =>
  async (payload) => {
    try {
      clientLogger.info("Adding members to project", {
        projectId: payload.projectId,
        emailsCount: payload.emails.length,
      });

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

      await projectMemberRepository.addByEmails(payload.projectId, payload.emails);

      clientLogger.info("Members added successfully", {
        projectId: payload.projectId,
        count: payload.emails.length,
      });
    } catch (error) {
      clientLogger.error("AddProjectMembersUseCase: failed", { error, command: payload });
      throw error;
    }
  };

export { createAddProjectMembersUseCase, type AddProjectMembersUseCase };
