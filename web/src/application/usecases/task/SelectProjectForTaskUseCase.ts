import type { TaskCreationDraft } from "@/domain/models/TaskCreationDraft";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import { ProjectId } from "@/domain/valueobjects/ProjectId";
import { ProjectMemberId } from "@/domain/valueobjects/ProjectMemberId";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type SelectProjectForTaskUseCase = (
  draft: TaskCreationDraft,
  projectId: string | number,
  currentAssigneeId: string | number | null,
) => Promise<{ success: boolean; assigneeCleared: boolean }>;

const createSelectProjectForTaskUseCase =
  (projectMemberRepository: ProjectMemberRepository): SelectProjectForTaskUseCase =>
  async (draft, projectId, currentAssigneeId) => {
    try {
      const id = ProjectId.create(projectId);
      const projectMembers = await projectMemberRepository.findByProjectId(id);

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
  };

export { createSelectProjectForTaskUseCase, type SelectProjectForTaskUseCase };
