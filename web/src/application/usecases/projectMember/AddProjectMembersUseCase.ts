import type { AddMembersPayload } from "@/application/payloads";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class AddProjectMembersUseCase {
  constructor(
    private projectMemberRepository: ProjectMemberRepository,
    private projectRepository: ProjectRepository
  ) {}

  async execute(payload: AddMembersPayload): Promise<void> {
    try {
      clientLogger.info("Adding members to project", {
        projectId: payload.projectId,
        emailsCount: payload.emails.length,
      });

      const projectId = ProjectId.create(payload.projectId);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      if (!project.canUserInviteMembers()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to invite members to this project"
        );
      }

      await this.projectMemberRepository.addByEmails(projectId, payload.emails);

      clientLogger.info("Members added successfully", {
        projectId: payload.projectId,
        count: payload.emails.length,
      });
    } catch (error) {
      clientLogger.error("AddProjectMembersUseCase: failed", { error, command: payload });
      throw error;
    }
  }
}
