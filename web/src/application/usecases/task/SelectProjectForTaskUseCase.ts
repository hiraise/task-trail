import type { TaskCreationDraft } from "@/domain/models/TaskCreationDraft";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { ProjectMemberId } from "@/domain/valueobjects/ProjectMemberId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

export class SelectProjectForTaskUseCase {
  constructor(private projectMemberRepository: ProjectMemberRepository) {}

  async execute(
    draft: TaskCreationDraft,
    projectId: string | number,
    currentAssigneeId: string | number | null
  ): Promise<{ success: boolean; assigneeCleared: boolean }> {
    try {
      const id = ProjectId.create(projectId);
      const projectMembers = await this.projectMemberRepository.findByProjectId(id);

      let assigneeCleared = false;

      if (currentAssigneeId) {
        const memberId = ProjectMemberId.create(currentAssigneeId);
        const isMember = projectMembers.some((member) => member.id.equals(memberId));

        if (!isMember) {
          draft.setAssigneeId(null);
          assigneeCleared = true;
        }
      }

      draft.setProjectById(projectId);

      return { success: true, assigneeCleared };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      clientLogger.error("SelectProjectForTaskUseCase failed:", { errorMessage });
      return { success: false, assigneeCleared: false };
    }
  }
}
