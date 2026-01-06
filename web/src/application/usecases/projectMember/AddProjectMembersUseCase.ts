import type { AddProjectMembersCommand } from "@/application/commands/projectMember/AddProjectMembersCommand";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectRepository } from "@/domain/repositories/ProjectRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { clientLogger } from "@/infrastructure/config/clientLogger";
import { AppError, AppErrorType } from "@/shared/errors/types";

export class AddProjectMembersUseCase {
  constructor(
    private projectMemberRepository: ProjectMemberRepository,
    private projectRepository: ProjectRepository,
  ) {}

  async execute(command: AddProjectMembersCommand): Promise<void> {
    try {
      clientLogger.info("Adding members to project", {
        projectId: command.projectId,
        emailsCount: command.emails.length,
      });

      const projectId = ProjectId.create(command.projectId);
      const project = await this.projectRepository.findById(projectId);

      if (!project) {
        throw new AppError(AppErrorType.NOT_FOUND, `Project not found: ${projectId}`);
      }

      if (!project.canUserInviteMembers()) {
        throw new AppError(
          AppErrorType.FORBIDDEN,
          "You do not have permission to invite members to this project",
        );
      }

      this.validateEmails(command.emails);

      await this.projectMemberRepository.addByEmails(projectId, command.emails);

      clientLogger.info("Members added successfully", {
        projectId: command.projectId,
        count: command.emails.length,
      });
    } catch (error) {
      clientLogger.error("AddProjectMembersUseCase: failed", { error, command });
      throw error;
    }
  }

  private validateEmails(emails: string[]): void {
    if (!emails || emails.length === 0) {
      throw new AppError(AppErrorType.VALIDATION, "At least one email is required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new AppError(AppErrorType.VALIDATION, `Invalid email format: ${email}`);
      }
    }
  }
}
