import type { TaskCreationDraft } from "@/domain/models/TaskCreationDraft";
import type { ProjectMemberRepository } from "@/domain/repositories/ProjectMemberRepository";
import type { ProjectId, UserId } from "@/domain/types";
import { clientLogger } from "@/infrastructure/config/clientLogger";

type SelectProjectForTaskUseCase = (
  draft: TaskCreationDraft,
  projectId: ProjectId,
  currentAssigneeId?: UserId | null,
) => Promise<{ success: boolean; assigneeCleared: boolean }>;

const createSelectProjectForTaskUseCase =
  (projectMemberRepository: ProjectMemberRepository): SelectProjectForTaskUseCase =>
  async (draft, projectId, currentAssigneeId) => {
    try {
      const projectMembers = await projectMemberRepository.findByProjectId(projectId);

      let assigneeCleared = false;

      if (currentAssigneeId) {
        const isMember = projectMembers.some((member) => member.id === currentAssigneeId);

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
