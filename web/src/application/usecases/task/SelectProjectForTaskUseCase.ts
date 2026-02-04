import type { ProjectMember } from "@/domain/models/ProjectMember";
import type { TaskCreationDraft } from "@/domain/models/TaskCreationDraft";
import type { ProjectId, UserId } from "@/domain/types";
import { projectMemberRepository } from "@/infrastructure/repositories";

export async function selectProjectForTaskUseCase(
  draft: TaskCreationDraft,
  projectId: ProjectId,
  currentAssigneeId?: UserId | null,
): Promise<{ assigneeCleared: boolean; projectMembers: ProjectMember[] }> {
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

  return { assigneeCleared, projectMembers };
}
